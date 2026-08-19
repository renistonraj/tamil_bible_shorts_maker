@echo off
setlocal
set "FFMPEG_EXE="

if defined FFMPEG_PATH if exist "%FFMPEG_PATH%" set "FFMPEG_EXE=%FFMPEG_PATH%"
if not defined FFMPEG_EXE if exist "%~dp0ffmpeg\bin\ffmpeg.exe" set "FFMPEG_EXE=%~dp0ffmpeg\bin\ffmpeg.exe"
if not defined FFMPEG_EXE if exist "C:\ffmpeg\bin\ffmpeg.exe" set "FFMPEG_EXE=C:\ffmpeg\bin\ffmpeg.exe"
if not defined FFMPEG_EXE if exist "%ProgramFiles%\ffmpeg\bin\ffmpeg.exe" set "FFMPEG_EXE=%ProgramFiles%\ffmpeg\bin\ffmpeg.exe"
if not defined FFMPEG_EXE if exist "%ProgramFiles(x86)%\ffmpeg\bin\ffmpeg.exe" set "FFMPEG_EXE=%ProgramFiles(x86)%\ffmpeg\bin\ffmpeg.exe"

if not defined FFMPEG_EXE (
  where ffmpeg.exe >nul 2>nul
  if errorlevel 1 (
    echo FFmpeg not found. Install FFmpeg or set FFMPEG_PATH to the full ffmpeg.exe path. 1>&2
    exit /b 9009
  )
  ffmpeg.exe %*
  exit /b %ERRORLEVEL%
)

"%FFMPEG_EXE%" %*
exit /b %ERRORLEVEL%
