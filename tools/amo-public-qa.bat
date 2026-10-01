@echo off
setlocal
set "ROOT=%~dp0.."
echo === AMO PUBLIC RELEASE QA ===
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$root=(Resolve-Path '%ROOT%').Path; $fail=0; $pub=Get-ChildItem $root -File -Filter *.html; $legacy=$pub|Select-String -SimpleMatch 'CHÍNH HÃNG','SỈ LẺ'; if($legacy){Write-Host ('BLOCKER legacy copy: '+$legacy.Count);$fail=1}else{Write-Host 'PASS approved copy'}; $demo=$pub|Select-String -SimpleMatch '16.000.000 đ','14.500.000 đ','11.000.000 đ','assets/images/demo/shoe-demo-1.jpg'; if($demo){Write-Host ('BLOCKER demo commerce data: '+$demo.Count);$fail=1}else{Write-Host 'PASS no demo commerce data'}; foreach($n in 'account.html','shop-admin.html','editor.html','data-center.html'){ $p=Join-Path $root $n; if(Test-Path $p){$x=Get-Content $p -Raw;if($x -notmatch 'noindex,nofollow'){Write-Host ('BLOCKER noindex '+$n);$fail=1}else{Write-Host ('PASS noindex '+$n)}}}; if($fail){exit 2}; Write-Host 'PASS PUBLIC RELEASE QA'"
exit /b %errorlevel%
