@echo off
setlocal
set "ROOT=%~dp0.."
set "TARGET=%~1"
if not defined TARGET set "TARGET=%ROOT%"
echo === AMO THEME V4 QA ===
if not exist "%TARGET%\js\amo-theme.js" exit /b 2
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0amo-theme-v4.ps1" -Root "%TARGET%"
exit /b %errorlevel%
