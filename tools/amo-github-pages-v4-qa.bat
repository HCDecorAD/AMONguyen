@echo off
setlocal
set "ROOT=%~dp0.."
echo === AMO GITHUB PAGES V4 QA ===
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$r=(Resolve-Path '%ROOT%').Path;$fail=0;$files=Get-ChildItem $r -Recurse -File -Include *.html,*.js,*.json,*.yml,*.yaml,*.txt,*.xml|?{$_.FullName -notmatch '\\.git\\|\\tools\\amo-github-pages-v4-qa\.bat$patterns=@('vercel.app','vercel.com','assets/images/demo/','assets/reference/','Trang chá»§','CHÍNH HÃNG','SỈ LẺ');foreach($p in $patterns){$m=$files|Select-String -SimpleMatch $p;if($m){Write-Host ('BLOCKER '+$p+' = '+$m.Count);$fail=1}};if(-not(Test-Path (Join-Path $r '404.html'))){Write-Host 'BLOCKER 404 missing';$fail=1};if($fail){exit 2};Write-Host 'PASS GITHUB PAGES V4 QA'"
exit /b %errorlevel%
};$patterns=@('vercel.app','vercel.com','assets/images/demo/','assets/reference/','Trang chá»§','CHÍNH HÃNG','SỈ LẺ');foreach($p in $patterns){$m=$files|Select-String -SimpleMatch $p;if($m){Write-Host ('BLOCKER '+$p+' = '+$m.Count);$fail=1}};if(-not(Test-Path (Join-Path $r '404.html'))){Write-Host 'BLOCKER 404 missing';$fail=1};if($fail){exit 2};Write-Host 'PASS GITHUB PAGES V4 QA'"
exit /b %errorlevel%
