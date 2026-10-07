@echo off
setlocal
set "ROOT=%~dp0.."
echo === AMO LINK + SEO QA ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0amo-link-seo-qa.ps1" -Root "%ROOT%"
exit /b %errorlevel%
