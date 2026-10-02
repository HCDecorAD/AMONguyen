param(
 [Parameter(Mandatory=$true)][string]$Root,
 [Parameter(Mandatory=$true)][string]$Source,
 [Parameter(Mandatory=$true)][string]$Zip
)
$src=(Resolve-Path $Source).Path
if(-not(Test-Path (Join-Path $src 'index.html'))){Write-Host 'BLOCKER package index missing';exit 4}
if(Test-Path $Zip){Remove-Item $Zip -Force}
Compress-Archive -Path (Join-Path $src '*') -DestinationPath $Zip -Force
if(-not(Test-Path $Zip)){Write-Host 'BLOCKER release ZIP missing';exit 5}
$h=Get-FileHash $Zip -Algorithm SHA256
$bytes=(Get-Item $Zip).Length
if($bytes -le 0){Write-Host 'BLOCKER release ZIP empty';exit 6}
Write-Host ('ZIP='+$h.Path)
Write-Host ('SHA256='+$h.Hash)
Write-Host ('BYTES='+$bytes)
Write-Host 'PASS RELEASE PACKAGE'
exit 0
