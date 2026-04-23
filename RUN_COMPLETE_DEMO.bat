@echo off
setlocal
cd /d %~dp0
powershell -ExecutionPolicy Bypass -NoProfile -File .\RUN_COMPLETE_DEMO.ps1
set exitcode=%ERRORLEVEL%
if not "%exitcode%"=="0" (
	echo.
	echo ❌ RUN_COMPLETE_DEMO failed with exit code %exitcode%
	echo (This window is paused so you can read the error.)
	pause
)
endlocal & exit /b %exitcode%
