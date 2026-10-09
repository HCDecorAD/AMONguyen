param([string]$Root)
$rootPath = (Resolve-Path $Root).Path
$ext = @('*.html','*.css','*.js','*.json')
$files = Get-ChildItem $rootPath -Recurse -File -Include $ext | Where-Object {
  $_.FullName -notmatch '\\.git\\|\\dist-public\\|\\vendor\\|\\tools\\|\\admin\\|\\brand\\'
}
$legacy=@(
  (-join @([char]0x0053,[char]0x1EC8,[char]0x0020,[char]0x004C,[char]0x1EBA)),
  (-join @([char]0x0043,[char]0x0048,[char]0x00CD,[char]0x004E,[char]0x0048,[char]0x0020,[char]0x0048,[char]0x00C3,[char]0x004E,[char]0x0047))
)
$bad = $files | Select-String -SimpleMatch $legacy
if ($bad) { Write-Host ('BLOCKER legacy copy: ' + $bad.Count); $bad | ForEach-Object { Write-Host ($_.Path + ':' + $_.LineNumber) }; exit 2 }
Write-Host 'PASS legacy copy'
$prices = @('16.000.000','14.500.000','11.000.000')
$refs = $files | Select-String -SimpleMatch $prices
if ($refs) { Write-Host ('BLOCKER demo prices: ' + $refs.Count); $refs | ForEach-Object { Write-Host ($_.Path + ':' + $_.LineNumber) }; exit 3 }
Write-Host 'PASS no demo prices'
$forbidden=$files|Select-String -SimpleMatch 'vercel.app','vercel.com','assets/reference/'
# Owner-approved AMO sample cards are allowed only in amo-shop.js; all other demo image references remain blocked.
$otherFiles=$files | Where-Object { $_.Name -ne 'amo-shop.js' }
$forbidden += $otherFiles | Select-String -SimpleMatch 'assets/images/demo/'
if($forbidden){Write-Host ('BLOCKER forbidden production refs: '+$forbidden.Count);$forbidden|ForEach-Object{Write-Host ($_.Path+':'+$_.LineNumber)};exit 4}
Write-Host 'PASS no forbidden production refs'
exit 0
