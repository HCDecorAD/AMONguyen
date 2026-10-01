@echo off
setlocal
set "ROOT=%~dp0.."
echo === AMO RC V4 GATE ===
call "%~dp0amo-auto-v4.bat" || exit /b 2
call "%~dp0amo-public-qa.bat" || exit /b 3
call "%~dp0amo-link-seo-qa.bat" || exit /b 4
call "%~dp0amo-build-public-v4.bat" || exit /b 5
powershell -NoProfile -Command "$d=Join-Path '%ROOT%' 'dist-public';$bad=Get-ChildItem $d -Recurse -File -Include *.html,*.js,*.css | Select-String -SimpleMatch 'assets/images/demo/','assets/reference/','shop-admin.html','editor.html','data-center.html';if($bad){$bad|%%{Write-Host ('BLOCKER '+$_.Path+':'+$_.LineNumber)};exit 6};Write-Host 'PASS AMO PUBLIC V4 RC GATE'"
exit /b %errorlevel%
