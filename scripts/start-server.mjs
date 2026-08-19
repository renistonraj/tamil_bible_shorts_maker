import { spawn } from "node:child_process";
import process from "node:process";

const pathEntries = [];

if (process.env.FFMPEG_PATH) {
  const value = process.env.FFMPEG_PATH.trim();
  if (value) {
    const normalized = value.replace(/[\\/]ffmpeg(?:\.exe)?$/i, "");
    pathEntries.push(normalized);
  }
}

if (process.platform === "win32") {
  pathEntries.push(
    "C:\\ffmpeg\\bin",
    `${process.env.ProgramFiles || "C:\\Program Files"}\\ffmpeg\\bin`,
    `${process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)"}\\ffmpeg\\bin`,
  );
}

const existingPath = process.env.PATH || process.env.Path || "";
const uniqueEntries = [...new Set([...pathEntries, ...existingPath.split(process.platform === "win32" ? ";" : ":")].filter(Boolean))];
const env = { ...process.env, PATH: uniqueEntries.join(process.platform === "win32" ? ";" : ":") };

const command = process.argv[2] || "server.ts";
const args = process.argv.slice(3);
const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["tsx", command, ...args], {
  stdio: "inherit",
  env,
  shell: false,
});

child.on("error", (error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Server stopped by signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
