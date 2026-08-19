import WebSocket from "ws";
import fs from "fs";
import path from "path";

const EDGE_TTS_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const EDGE_TTS_URL = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/cognitive/v1";

function uuidv4(): string {
  return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/[x]/g, () =>
    ((Math.random() * 16) | 0).toString(16),
  );
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
  return /^[a-z]{2,3}-[A-Z]{2,3}-[A-Za-z]+(?:Neural|MultilingualNeural)$/i.test(voice);
}

/** Generate MP3 audio using the Edge TTS websocket protocol. */
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
    const wsUrl = `${EDGE_TTS_URL}?TrustedClientToken=${EDGE_TTS_TOKEN}&ConnectionId=${requestId}`;
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        Origin: "chrome-extension://jdiccldimpdaibocandgnbnoatgfbyco",
      },
      handshakeTimeout: 15000,
    });

    ws.on("open", () => {
      try {
        const timestamp = new Date().toISOString();
        const configHeader = [
          "Path: speech.config",
          `X-RequestId: ${requestId}`,
          `X-Timestamp: ${timestamp}`,
          "Content-Type: application/json",
          "",
          "",
        ].join("\r\n");

        const configBody = JSON.stringify({
          context: {
            system: {
              name: "SpeechSDK",
              version: "1.30.0",
              build: "JavaScript",
              lang: "JavaScript",
            },
            os: {
              platform: process.platform === "win32" ? "Windows" : process.platform,
              name: "Chrome",
              version: "120.0",
            },
          },
        });
        ws.send(configHeader + configBody);

        const ssmlHeader = [
          "Path: ssml",
          `X-RequestId: ${requestId}`,
          `X-Timestamp: ${timestamp}`,
          "Content-Type: application/ssml+xml",
          "",
          "",
        ].join("\r\n");

        const ssmlBody = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${escapeXml(cleanVoice)}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escapeXml(cleanText)}</prosody></voice></speak>`;
        ws.send(ssmlHeader + ssmlBody);

        closeTimer = setTimeout(() => {
          fail(new Error("Edge TTS timed out after 45 seconds."));
        }, 45000);
      } catch (error: any) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    });

    ws.on("message", (data: WebSocket.Data) => {
      try {
        if (Buffer.isBuffer(data)) {
          const headerText = data.toString("utf8", 0, Math.min(data.length, 256));
          if (headerText.includes("Path:audio")) {
            const separator = Buffer.from("\r\n\r\n");
            const bodyStart = data.indexOf(separator);
            if (bodyStart >= 0) {
              const audioChunk = data.subarray(bodyStart + separator.length);
              if (audioChunk.length > 0) audioBuffers.push(audioChunk);
            }
          }
        } else {
          const message = data.toString();
          if (message.includes("Path:turn.end")) {
            finished = true;
            ws.close();
          }
          if (message.includes("Path:response") && message.toLowerCase().includes("error")) {
            fail(new Error(`Edge TTS response error: ${message.slice(0, 500)}`));
          }
        }
      } catch (error: any) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    });

    ws.on("error", (error) => {
      fail(error instanceof Error ? error : new Error(String(error)));
    });

    ws.on("close", () => {
      if (!settled) succeed();
    });
  });
}
