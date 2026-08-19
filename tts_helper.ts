import WebSocket from "ws";
import fs from "fs";
import path from "path";

function uuidv4() {
  return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/[x]/g, () => {
    return ((Math.random() * 16) | 0).toString(16);
  });
}

export function generateEdgeTTS(text: string, voice: string, outputFile: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const requestId = uuidv4();
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/cognitive/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=${requestId}`;
    
    const ws = new WebSocket(wsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "Origin": "chrome-extension://jdiccldimpdaibocandgnbnoatgfbyco"
      }
    });

    const audioBuffers: Buffer[] = [];
    let isFinished = false;

    ws.on("open", () => {
      // 1. Send speech.config
      const timestamp = Date.now();
      const configHeader = `Path: speech.config\r\nX-RequestId: ${requestId}\r\nX-Timestamp: ${timestamp}\r\nContent-Type: application/json\r\n\r\n`;
      const configBody = JSON.stringify({
        context: {
          system: {
            name: "SpeechSDK",
            version: "1.30.0",
            build: "JavaScript",
            lang: "JavaScript"
          },
          os: {
            platform: "Windows",
            name: "Chrome",
            version: "120.0"
          }
        }
      });
      ws.send(configHeader + configBody);

      // 2. Send SSML
      // Format audio to webm-24khz-16bit-mono-opus or audio-24khz-48kbitrate-mono-mp3
      const ssmlHeader = `Path: ssml\r\nX-RequestId: ${requestId}\r\nX-Timestamp: ${timestamp}\r\nContent-Type: application/ssml+xml\r\n\r\n`;
      const escapedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
      
      const ssmlBody = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escapedText}</prosody></voice></speak>`;
      ws.send(ssmlHeader + ssmlBody);
    });

    ws.on("message", (data: WebSocket.Data) => {
      if (Buffer.isBuffer(data)) {
        // Handle binary message (audio chunk)
        const textStr = data.toString("utf8", 0, Math.min(data.length, 200));
        const headerIndex = textStr.indexOf("Path:audio");
        if (headerIndex !== -1) {
          const bodyStartIndex = data.indexOf("\r\n\r\n") + 4;
          if (bodyStartIndex !== -1 && bodyStartIndex < data.length) {
            const audioChunk = data.subarray(bodyStartIndex);
            audioBuffers.push(audioChunk);
          }
        }
      } else if (typeof data === "string") {
        if (data.includes("Path:turn.end")) {
          isFinished = true;
          ws.close();
        }
      }
    });

    ws.on("close", () => {
      if (isFinished && audioBuffers.length > 0) {
        const finalBuffer = Buffer.concat(audioBuffers);
        fs.mkdirSync(path.dirname(outputFile), { recursive: true });
        fs.writeFileSync(outputFile, finalBuffer);
        
        // Return duration using a quick estimate or ffprobe if needed.
        // Or we can query the audio file duration using ffprobe!
        // Let's use ffprobe to get the exact duration of the MP3 file!
        resolve(audioBuffers.length); // fallback count or handled in a main wrapper
      } else {
        reject(new Error("WebSocket closed before completion or no audio data received"));
      }
    });

    ws.on("error", (err) => {
      reject(err);
    });
  });
}
