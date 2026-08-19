@echo off
REM Windows compatibility shim for the Node server's python3 command.
REM Prefer the Windows Python launcher when available, then fall back to python.
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  py %*
  exit /b %ERRORLEVEL%
)
python %*
exit /b %ERRORLEVEL%
