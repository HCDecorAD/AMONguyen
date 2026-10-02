@echo off
setlocal
set "ROOT=%~dp0.."
set "TARGET=%~1"
if not defined TARGET set "TARGET=%ROOT%"
echo === AMO PUBLIC RELEASE QA ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0amo-public-qa.ps1" -Root "%TARGET%"
exit /b %errorlevel%
