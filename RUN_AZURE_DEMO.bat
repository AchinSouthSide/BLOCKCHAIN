@echo off
setlocal
cd /d %~dp0
powershell -ExecutionPolicy Bypass -NoProfile -File .\RUN_DEMO.ps1
endlocal
