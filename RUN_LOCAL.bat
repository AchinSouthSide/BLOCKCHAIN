@echo off
setlocal
cd /d %~dp0
powershell -ExecutionPolicy Bypass -NoProfile -File .\RUN_LOCAL.ps1
endlocal
