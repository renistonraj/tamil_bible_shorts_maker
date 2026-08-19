# Windows FFmpeg setup

The app's server uses `ffmpeg` for video rendering and `ffprobe` for TTS duration validation.

The repository includes wrappers for both commands. They support common Windows FFmpeg locations and `FFMPEG_PATH`.

Example:

```bat
set FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe
npm run dev
```

Run `render_test.cmd` to verify both dependencies before rendering.