import { createHash, randomBytes } from "node:crypto";
import WebSocket from "ws";
import fs from "fs";
import path from "path";

const EDGE_TTS_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const EDGE_TTS_URL = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
// Keep this aligned with a current Chromium build. Edge TTS now validates the
// Sec-MS-GEC token against the browser version as well as the request time.
const CHROMIUM_FULL_VERSION = process.env.EDGE_TTS_CHROMIUM_VERSION || "143.0.3650.75";
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".")[0];

function uuidv4(): string {
  return randomBytes(16).toString("hex");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isSupportedVoice(voice: string): boolean {
  return /^[a-z]{2,3}-[A-Z]{2,3}(?:-[A-Za-z]+)+Neural(?:HD|Multilingual)?$/i.test(voice);
}

/**
 * Edge TTS requires a time-windowed Sec-MS-GEC token. The old implementation
 * only sent TrustedClientToken + ConnectionId, which now results in HTTP 400
 * during the WebSocket handshake.
 */
function generateSecMsGec(): string {
  const unixSeconds = Math.floor(Date.now() / 1000);
  const windowsEpochSeconds = unixSeconds + 11644473600;
  const roundedSeconds = windowsEpochSeconds - (windowsEpochSeconds % 300);
  const windowsTicks = roundedSeconds * 10_000_000;
  return createHash("sha256")
    .update(`${windowsTicks}${EDGE_TTS_TOKEN}`, "utf8")
    .digest("hex")
    .toUpperCase();
}

/** Generate MP3 audio using the current Edge TTS websocket protocol. */
export function generateEdgeTTS(
  text: string,
  voice: string,
  outputFile: string,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const cleanText = String(text ?? "").trim();
    const cleanVoice = String(voice ?? "").trim();

    if (!cleanText) {
      reject(new Error("TTS text cannot be empty."));
      return;
    }
    if (!cleanVoice || !isSupportedVoice(cleanVoice)) {
      reject(new Error(`Unsupported TTS voice: ${cleanVoice || "empty"}`));
      return;
    }

    const requestId = uuidv4();
    const secMsGec = generateSecMsGec();
    const wsUrl = `${EDGE_TTS_URL}?TrustedClientToken=${EDGE_TTS_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-${CHROMIUM_FULL_VERSION}&ConnectionId=${requestId}`;
    const audioBuffers: Buffer[] = [];
    let finished = false;
    let settled = false;
    let closeTimer: NodeJS.Timeout | null = null;
    let ws: WebSocket;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      if (closeTimer) clearTimeout(closeTimer);
      try { ws?.close(); } catch { /* cleanup */ }
      if (fs.existsSync(outputFile)) {
        try { fs.unlinkSync(outputFile); } catch { /* cleanup */ }
      }
      reject(error);
    };

    const succeed = () => {
      if (settled) return;
      if (!finished || audioBuffers.length === 0) {
        fail(new Error("Edge TTS returned no complete audio data."));
        return;
      }

      try {
        const finalBuffer = Buffer.concat(audioBuffers);
        if (finalBuffer.length < 256) {
          throw new Error("Edge TTS returned an unexpectedly small audio file.");
        }
        fs.mkdirSync(path.dirname(outputFile), { recursive: true });
        fs.writeFileSync(outputFile, finalBuffer);
        settled = true;
        if (closeTimer) clearTimeout(closeTimer);
        resolve(finalBuffer.length);
      } catch (error: any) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    };

    ws = new WebSocket(wsUrl, {
      headers: {
        "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
        "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "Accept-Language": "en-US,en;q=0.9",
      },
      handshakeTimeout: 15000,
    });

    ws.on("open", () => {
      try {
        const timestamp = new Date().toISOString();
        const configHeader = [
          "Content-Type:application/json; charset=utf-8",
          "Path:speech.config",
          "",
          "",
        ].join("\r\n");

        const configBody = JSON.stringify({
          context: {
            synthesis: {
              audio: {
                metadataoptions: {
                  sentenceBoundaryEnabled: "false",
                  wordBoundaryEnabled: "false",
                },
                outputFormat: "audio-24khz-48kbitrate-mono-mp3",
              },
            },
          },
        });
        ws.send(configHeader + configBody);

        const ssmlHeader = [
          `X-RequestId:${requestId}`,
          "Content-Type:application/ssml+xml",
          `X-Timestamp:${timestamp}Z`,
          "Path:ssml",
          "",
          "",
        ].join("\r\n");

        const ssmlBody = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='en-US'><voice name='${escapeXml(cleanVoice)}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escapeXml(cleanText)}</prosody></voice></speak>`;
        ws.send(ssmlHeader + ssmlBody);

        closeTimer = setTimeout(() => {
          fail(new Error("Edge TTS timed out after 45 seconds."));
        }, 45000);
      } catch (error: any) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    });

    ws.on("message", (data: WebSocket.Data, isBinary: boolean) => {
      try {
        const buffer = Buffer.isBuffer(data)
          ? data
          : Array.isArray(data)
            ? Buffer.concat(data)
            : Buffer.from(data as any);

        if (isBinary || Buffer.isBuffer(data)) {
          const headerText = buffer.toString("utf8", 0, Math.min(buffer.length, 512));
          const separator = Buffer.from("\r\n\r\n");
          const bodyStart = buffer.indexOf(separator);
          if (bodyStart >= 0 && /Path:audio\r\n/i.test(headerText)) {
            const audioChunk = buffer.subarray(bodyStart + separator.length);
            if (audioChunk.length > 0) audioBuffers.push(audioChunk);
          }
          return;
        }

        const message = buffer.toString("utf8");
        if (message.includes("Path:turn.end")) {
          finished = true;
          try { ws.close(); } catch { /* cleanup */ }
        }
      } catch (error: any) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    });

    ws.on("error", (error: any) => {
      const code = error?.code ? ` (${error.code})` : "";
      fail(new Error(`Edge TTS WebSocket error${code}: ${error?.message || String(error)}`));
    });

    ws.on("unexpected-response", (_request, response) => {
      fail(new Error(`Edge TTS handshake failed: HTTP ${response.statusCode} ${response.statusMessage || ""}. The Sec-MS-GEC/Chromium protocol parameters were rejected.`));
    });

    ws.on("close", () => {
      if (!settled) succeed();
    });
  });
}
