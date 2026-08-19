# Rendering / Audio troubleshooting

The renderer invokes `ffmpeg` and `ffprobe` from the server process. On Windows, these executables are not always on PATH.

This repository now includes `ffmpeg.cmd` and `ffprobe.cmd` wrappers. They automatically look for:

1. `FFMPEG_PATH` (full path to `ffmpeg.exe`)
2. `ffmpeg\bin` inside the project
3. `C:\ffmpeg\bin`
4. `%ProgramFiles%\ffmpeg\bin`
5. `%ProgramFiles(x86)%\ffmpeg\bin`
6. the normal system PATH

For a custom installation, set `FFMPEG_PATH`, for example:

```bat
set FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe
npm run dev
```

The TTS endpoint uses `ffprobe` to verify generated MP3 duration. If `ffprobe` is unavailable, the previous implementation returned HTTP 500 even when audio generation itself had succeeded. The wrapper makes that Windows setup reliable.
