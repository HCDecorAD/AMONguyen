param([Parameter(Mandatory=$true)][string]$Root)
$rootPath=(Resolve-Path $Root).Path
$fail=0
$pub=Get-ChildItem $rootPath -Recurse -File -Filter *.html | Where-Object { $_.FullName -notmatch '\\.git\\|\\dist-public\\|\\vendor\\|\\tools\\|\\admin\\|\\brand\\|\\assets\\reference\\|\\assets\\images\\demo\\' }
$legacy=@(
  (-join @([char]0x0053,[char]0x1EC8,[char]0x0020,[char]0x004C,[char]0x1EBA)),
  (-join @([char]0x0043,[char]0x0048,[char]0x00CD,[char]0x004E,[char]0x0048,[char]0x0020,[char]0x0048,[char]0x00C3,[char]0x004E,[char]0x0047))
)
$m=$pub|Select-String -SimpleMatch $legacy
if($m){Write-Host ('BLOCKER legacy copy: '+$m.Count);$fail=1}else{Write-Host 'PASS approved copy'}
$demo=$pub|Select-String -SimpleMatch 'assets/images/demo/','AMO_FALLBACK','16.000.000','14.500.000','11.000.000'
if($demo){Write-Host ('BLOCKER demo content: '+$demo.Count);$fail=1}else{Write-Host 'PASS no demo content'}
if($fail){exit 2}
Write-Host 'PASS PUBLIC RELEASE QA'
exit 0
