param([string]$Root)
$rootPath = (Resolve-Path $Root).Path
$ext = @('*.html','*.css','*.js','*.json')
$files = Get-ChildItem $rootPath -Recurse -File -Include $ext | Where-Object {
  $_.FullName -notmatch '\\.git\\|\\dist-public\\|\\vendor\\|\\tools\\|\\admin\\|\\brand\\' -and $_.Name -ne 'guide.html'
}
$legacy = @([char]0x0053+[char]0x1EC8+' L'+[char]0x1EBA, 'CH'+[char]0x00CD+'NH H'+[char]0x00C3+'NG')
$bad = $files | Select-String -SimpleMatch $legacy
if ($bad) { Write-Host ('BLOCKER legacy copy: ' + $bad.Count); $bad | ForEach-Object { Write-Host ($_.Path + ':' + $_.LineNumber) }; exit 2 }
Write-Host 'PASS legacy copy'
$prices = @('16.000.000 d','14.500.000 d','11.000.000 d')
$refs = $files | Select-String -SimpleMatch $prices
if ($refs) { Write-Host ('BLOCKER demo prices: ' + $refs.Count); exit 3 }
Write-Host 'PASS no demo prices'
exit 0
