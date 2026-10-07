param([string]$Root)
$r=(Resolve-Path $Root).Path
$fail=0
$files=Get-ChildItem $r -Recurse -File -Include *.html,*.js,*.json,*.yml,*.yaml,*.txt,*.xml
$patterns=@('vercel.app','vercel.com','assets/images/demo/','assets/reference/')
foreach($p in $patterns){$m=$files|Select-String -SimpleMatch $p;if($m){Write-Host ('BLOCKER '+$p+' = '+$m.Count);$fail=1}}
if(-not(Test-Path (Join-Path $r '404.html'))){Write-Host 'BLOCKER 404 missing';$fail=1}
if($fail){exit 2}
Write-Host 'PASS GITHUB PAGES V4 QA'
