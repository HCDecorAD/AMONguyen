@echo off
setlocal
set "ROOT=%~dp0.."
set "OUT=%ROOT%\dist-public"
if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%"
robocopy "%ROOT%" "%OUT%" /E /XD .git tools admin dist-public reference demo /XF shop-admin.html editor.html data-center.html account.html *.bat *.ps1 >nul
if exist "%OUT%\assets\reference" rmdir /s /q "%OUT%\assets\reference"
if exist "%OUT%\assets\images\demo" rmdir /s /q "%OUT%\assets\images\demo"
echo Built public package: %OUT%
powershell -NoProfile -Command "$bad=Get-ChildItem '%OUT%' -Recurse -File -Include *.html,*.js,*.json | Select-String -SimpleMatch 'CHÍNH HÃNG','SỈ LẺ','AMO_FALLBACK','assets/reference/'; if($bad){$bad|ForEach-Object{Write-Host $_.Path ':' $_.LineNumber}; exit 2}; Write-Host 'PASS public package content QA'"
exit /b %errorlevel%
