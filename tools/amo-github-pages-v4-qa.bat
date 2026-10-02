@echo off
setlocal
set "ROOT=%~dp0.."
set "TARGET=%~1"
if not defined TARGET set "TARGET=%ROOT%\dist-public"
echo === AMO GITHUB PAGES V4 QA ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0amo-github-pages-v4.ps1" -Root "%TARGET%"
exit /b %errorlevel%
