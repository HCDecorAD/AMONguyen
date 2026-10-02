param([Parameter(Mandatory=$true)][string]$Root)
$rootPath=(Resolve-Path $Root).Path
$fail=0
$pub=Get-ChildItem $rootPath -Recurse -File -Filter *.html
$legacy=@([char]0x0053+[char]0x1EC8+' L'+[char]0x1EBA,'CH'+[char]0x00CD+'NH H'+[char]0x00C3+'NG')
$m=$pub|Select-String -SimpleMatch $legacy
if($m){Write-Host ('BLOCKER legacy copy: '+$m.Count);$fail=1}else{Write-Host 'PASS approved copy'}
$demo=$pub|Select-String -SimpleMatch 'assets/images/demo/','AMO_FALLBACK'
if($demo){Write-Host ('BLOCKER demo content: '+$demo.Count);$fail=1}else{Write-Host 'PASS no demo content'}
if($fail){exit 2}
Write-Host 'PASS PUBLIC RELEASE QA'
exit 0
