@echo off
setlocal
set "ROOT=%~dp0.."
set "OUT=%ROOT%\dist-public"
if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%"
robocopy "%ROOT%" "%OUT%" /E /XD .git tools admin dist-public reference demo /XF shop-admin.html editor.html data-center.html account.html *.bat *.ps1 >nul
set "RC=%ERRORLEVEL%"
if %RC% GEQ 8 exit /b %RC%
if exist "%OUT%\assets\reference" rmdir /s /q "%OUT%\assets\reference"
if exist "%OUT%\assets\images\demo" rmdir /s /q "%OUT%\assets\images\demo"
echo Built public package: %OUT%
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0amo-public-qa.ps1" -Root "%OUT%"
exit /b %errorlevel%
