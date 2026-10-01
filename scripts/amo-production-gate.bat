@echo off
setlocal
set "ROOT=%~dp0.."
set "QA=%ROOT%\.qa"
cd /d "%ROOT%"
if not exist "%QA%" mkdir "%QA%"
call scripts\amo-architecture-gate.bat
if errorlevel 1 exit /b %ERRORLEVEL%
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0qa-production.ps1" > "%QA%\production.log" 2>&1
set "RC=%ERRORLEVEL%"
type "%QA%\production.log"
if not "%RC%"=="0" exit /b %RC%
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0qa-theme.ps1" > "%QA%\theme.log" 2>&1
set "TR=%ERRORLEVEL%"
type "%QA%\theme.log"
if not "%TR%"=="0" exit /b %TR%
echo [AMO] GITHUB PAGES + THEME PRODUCTION PASS
exit /b 0
