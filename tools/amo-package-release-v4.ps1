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
$evidence=Join-Path $Root 'AMO-Nguyen-Public-V4.sha256.txt'
$commit=''
try{$commit=(& git -C $Root rev-parse HEAD 2>$null).Trim()}catch{}
$lines=@('SHA256='+$h.Hash,'BYTES='+$bytes,'FILE='+[IO.Path]::GetFileName($Zip))
if($commit -match '^[0-9a-fA-F]{40}
Write-Host ('EVIDENCE='+$evidence)
Write-Host 'PASS RELEASE PACKAGE'
exit 0
){$lines+=('COMMIT='+$commit);Write-Host ('COMMIT='+$commit)}
$lines|Set-Content -Path $evidence -Encoding ascii
Write-Host ('EVIDENCE='+$evidence)
Write-Host 'PASS RELEASE PACKAGE'
exit 0
