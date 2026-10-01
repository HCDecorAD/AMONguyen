$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$files=Get-ChildItem $root -Recurse -File -Include *.html,*.css,*.js,*.json | Where-Object {$_.FullName -notmatch '\\.git\\'}
$changed=0
foreach($f in $files){
  $s=Get-Content $f.FullName -Raw
  $t=$s.Replace('SHOP GIÀY AMO NGUYỄN','SHOP GIÀY SI AMO NGUYỄN')
  $t=$t.Replace('SHOP GIÀY AMO NGUYEN','SHOP GIÀY SI AMO NGUYỄN')
  $t=$t.Replace('CHUYÊN SỈ LẺ-GIÀY SI HIỆU CHÍNH HÃNG','CHUYÊN GIÀY SI HIỆU NAM')
  $t=$t.Replace('CHUYÊN SỈ LẺ - GIÀY SI HIỆU CHÍNH HÃNG','CHUYÊN GIÀY SI HIỆU NAM')
  if($t -ne $s){Set-Content $f.FullName $t -Encoding UTF8; $changed++}
}
Write-Host "COPY_LOCK_CHANGED=$changed"
Write-Host 'APPROVED_TOP=SHOP GIÀY SI AMO NGUYỄN'
Write-Host 'APPROVED_SUB=CHUYÊN GIÀY SI HIỆU NAM'
