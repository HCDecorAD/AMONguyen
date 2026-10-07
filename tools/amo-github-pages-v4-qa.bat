@echo off
setlocal
set "ROOT=%~dp0.."
echo === AMO GITHUB PAGES V4 QA ===
call "%~dp0amo-rc-v4.bat"
if errorlevel 1 exit /b 2
if not exist "%ROOT%\dist-public\404.html" exit /b 3
echo PASS GITHUB PAGES V4 QA
exit /b 0
