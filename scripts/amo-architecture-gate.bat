@echo off
setlocal
set "ROOT=%~dp0.."
set "QA=%ROOT%\.qa"
cd /d "%ROOT%"
if not exist "%QA%" mkdir "%QA%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0qa-architecture.ps1" > "%QA%\architecture.log" 2>&1
set "RC=%ERRORLEVEL%"
type "%QA%\architecture.log"
if not "%RC%"=="0" exit /b %RC%
echo [AMO] GITHUB PAGES ARCHITECTURE PASS
exit /b 0
