@echo off
setlocal
set "ROOT=%~dp0.."
echo === AMO THEME V4 QA ===
if not exist "%ROOT%\js\amo-theme.js" exit /b 2
powershell -NoProfile -ExecutionPolicy Bypass -Command "$r=(Resolve-Path '%ROOT%').Path;$bad=Get-ChildItem $r -File -Filter *.html|?{(Get-Content $_.FullName -Raw) -notmatch 'js/amo-theme.js'};if($bad){$bad|%%{Write-Host ('MISSING THEME '+$_.Name)};exit 3};$js=Get-Content (Join-Path $r 'js\amo-theme.js') -Raw;if($js -notmatch 'AMO_THEME'){exit 4};Write-Host 'PASS AMO THEME V4'"
exit /b %errorlevel%
