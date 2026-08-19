@echo off
setlocal

echo === Bible Shorts Maker: FFmpeg dependency test ===
echo.
echo [1/2] Checking FFmpeg...
ffmpeg -version
if errorlevel 1 (
  echo.
  echo FFmpeg check FAILED.
  echo Set FFMPEG_PATH to your ffmpeg.exe and run this test again.
  exit /b 1
)

echo.
echo [2/2] Checking FFprobe...
ffprobe -version
if errorlevel 1 (
  echo.
  echo FFprobe check FAILED.
  echo Set FFMPEG_PATH to your ffmpeg.exe and run this test again.
  exit /b 1
)

echo.
echo FFmpeg and FFprobe are available. Rendering/audio dependencies are ready.
exit /b 0
