param([Parameter(Mandatory=$true)][string]$Root)
$r=(Resolve-Path $Root).Path
$fail=0
$files=Get-ChildItem $r -Recurse -File -Include *.html,*.js,*.json,*.yml,*.yaml,*.txt,*.xml
$legacy=@(
  (-join @([char]0x0053,[char]0x1EC8,[char]0x0020,[char]0x004C,[char]0x1EBA)),
  (-join @([char]0x0043,[char]0x0048,[char]0x00CD,[char]0x004E,[char]0x0048,[char]0x0020,[char]0x0048,[char]0x00C3,[char]0x004E,[char]0x0047))
)
$patterns=@('vercel.app','vercel.com','assets/images/demo/','assets/reference/')+$legacy
foreach($p in $patterns){$m=$files|Select-String -SimpleMatch $p;if($m){Write-Host ('BLOCKER '+$p+' = '+$m.Count);$fail=1}}
if(-not(Test-Path (Join-Path $r '404.html'))){Write-Host 'BLOCKER 404 missing';$fail=1}
$pub=Get-ChildItem $r -Recurse -File -Filter *.html
$missing=$pub|Where-Object{(Get-Content $_.FullName -Raw)-notmatch 'js/amo-theme\.js'}
if($missing){$missing|ForEach-Object{Write-Host ('BLOCKER theme '+$_.Name)};$fail=1}
if($fail){exit 3}
Write-Host 'PASS GITHUB PAGES V4 QA'
exit 0
