param([string]$Root)
$rootPath=(Resolve-Path $Root).Path
$ext=@('*.html','*.css','*.js','*.json')
$files=Get-ChildItem $rootPath -Recurse -File -Include $ext | Where-Object {
  $_.FullName -notmatch '\\.git\\|\\dist-public\\|\\vendor\\|\\tools\\|\\admin\\|\\brand\\' -and $_.Name -ne 'guide.html'
}
$bad=$files | Select-String -SimpleMatch 'SỈ LẺ','CHÍNH HÃNG'
if($bad){ Write-Host ('BLOCKER legacy copy: '+$bad.Count); $bad | ForEach-Object { Write-Host ($_.Path+':'+$_.LineNumber) }; exit 2 }
Write-Host 'PASS legacy copy'
$refs=$files | Select-String -SimpleMatch '16.000.000 đ','14.500.000 đ','11.000.000 đ'
if($refs){ Write-Host ('BLOCKER demo prices: '+$refs.Count); exit 3 }
Write-Host 'PASS no demo prices'
exit 0
