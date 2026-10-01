@echo off
setlocal
set "ROOT=%~dp0.."
echo [AMO] V4 QA helper
echo Target: %ROOT%
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0amo-auto-v4.ps1" -Root "%ROOT%"
if errorlevel 1 exit /b %errorlevel%
echo PASS AMO V4 QA
