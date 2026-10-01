@echo off
setlocal
set "ROOT=%~dp0.."
set "OUT=%ROOT%\dist-public"
set "ZIP=%ROOT%\AMO-Nguyen-Public-V4.zip"
echo === AMO PUBLIC V4 RELEASE ===
call "%~dp0amo-github-pages-v4-qa.bat" || exit /b 2
call "%~dp0amo-rc-v4.bat" || exit /b 3
if not exist "%OUT%\index.html" exit /b 4
if exist "%ZIP%" del /q "%ZIP%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%OUT%\*' -DestinationPath '%ZIP%' -Force; $h=Get-FileHash '%ZIP%' -Algorithm SHA256; Write-Host ('ZIP='+$h.Path); Write-Host ('SHA256='+$h.Hash); Write-Host ('BYTES='+(Get-Item $h.Path).Length)"
exit /b %errorlevel%
