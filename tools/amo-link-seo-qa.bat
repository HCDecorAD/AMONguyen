@echo off
setlocal
set "ROOT=%~dp0.."
set "TARGET=%~1"
if not defined TARGET set "TARGET=%ROOT%"
echo === AMO LINK + SEO QA ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0amo-link-seo-qa.ps1" -Root "%TARGET%"
exit /b %errorlevel%
