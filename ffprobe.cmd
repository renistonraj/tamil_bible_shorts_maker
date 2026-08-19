@echo off
setlocal
set "FFPROBE_EXE="

if defined FFMPEG_PATH (
  for %%F in ("%FFMPEG_PATH%") do set "FFMPEG_DIR=%%~dpF"
  if defined FFMPEG_DIR if exist "%FFMPEG_DIR%ffprobe.exe" set "FFPROBE_EXE=%FFMPEG_DIR%ffprobe.exe"
)
if not defined FFPROBE_EXE if exist "%~dp0ffmpeg\bin\ffprobe.exe" set "FFPROBE_EXE=%~dp0ffmpeg\bin\ffprobe.exe"
if not defined FFPROBE_EXE if exist "C:\ffmpeg\bin\ffprobe.exe" set "FFPROBE_EXE=C:\ffmpeg\bin\ffprobe.exe"
if not defined FFPROBE_EXE if exist "%ProgramFiles%\ffmpeg\bin\ffprobe.exe" set "FFPROBE_EXE=%ProgramFiles%\ffmpeg\bin\ffprobe.exe"
if not defined FFPROBE_EXE if exist "%ProgramFiles(x86)%\ffmpeg\bin\ffprobe.exe" set "FFPROBE_EXE=%ProgramFiles(x86)%\ffmpeg\bin\ffprobe.exe"

if not defined FFPROBE_EXE (
  where ffprobe.exe >nul 2>nul
  if errorlevel 1 (
    echo FFprobe not found. Install FFmpeg or set FFMPEG_PATH to the full ffmpeg.exe path. 1>&2
    exit /b 9009
  )
  ffprobe.exe %*
  exit /b %ERRORLEVEL%
)

"%FFPROBE_EXE%" %*
exit /b %ERRORLEVEL%
