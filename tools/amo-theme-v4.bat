@echo off
setlocal
set "ROOT=%~dp0.."
echo === AMO THEME V4 QA ===
if not exist "%ROOT%\js\amo-theme.js" exit /b 2
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0amo-theme-v4.ps1" -Root "%ROOT%"
exit /b %errorlevel%
