@echo off
setlocal
set "ROOT=%~dp0.."
set "TARGET=%~1"
if not defined TARGET set "TARGET=%ROOT%\dist-public"
echo === AMO GITHUB PAGES V4 QA ===
if not exist "%TARGET%\index.html" exit /b 2
powershell -NoProfile -ExecutionPolicy Bypass -Command "$r=(Resolve-Path '%TARGET%').Path;$fail=0;$files=Get-ChildItem $r -Recurse -File -Include *.html,*.js,*.json,*.yml,*.yaml,*.txt,*.xml;$patterns=@('vercel.app','vercel.com','assets/images/demo/','assets/reference/','CHÍNH HÃNG','SỈ LẺ');foreach($p in $patterns){$m=$files|Select-String -SimpleMatch $p;if($m){Write-Host ('BLOCKER '+$p+' = '+$m.Count);$fail=1}};if(-not(Test-Path (Join-Path $r '404.html'))){Write-Host 'BLOCKER 404 missing';$fail=1};$pub=Get-ChildItem $r -File -Filter *.html;$missing=$pub|Where-Object{(Get-Content $_.FullName -Raw) -notmatch 'js/amo-theme.js'};if($missing){$missing|ForEach-Object{Write-Host ('BLOCKER theme '+$_.Name)};$fail=1};if($fail){exit 3};Write-Host 'PASS GITHUB PAGES V4 QA'"
exit /b %errorlevel%
