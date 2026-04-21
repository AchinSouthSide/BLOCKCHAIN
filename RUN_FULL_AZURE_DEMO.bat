@echo off
setlocal
cd /d %~dp0
powershell -ExecutionPolicy Bypass -NoProfile -File .\RUN_FULL_AZURE_DEMO.ps1
endlocal
