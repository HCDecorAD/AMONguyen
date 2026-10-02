@echo off
setlocal
set "ROOT=%~dp0.."
set "OUT=%ROOT%\dist-public"
set "ZIP=%ROOT%\AMO-Nguyen-Public-V4.zip"
echo === AMO PUBLIC V4 RELEASE ===
call "%~dp0amo-rc-v4.bat" || exit /b 2
call "%~dp0amo-github-pages-v4-qa.bat" "%OUT%" || exit /b 3
if not exist "%OUT%\index.html" exit /b 4
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0amo-package-release-v4.ps1" -Root "%ROOT%" -Source "%OUT%" -Zip "%ZIP%"
exit /b %errorlevel%
