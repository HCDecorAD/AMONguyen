param([Parameter(Mandatory=$true)][string]$Root)
$d=(Resolve-Path $Root).Path
$files=Get-ChildItem $d -Recurse -File -Include *.html,*.js,*.css
$bad=$files|Select-String -SimpleMatch 'assets/images/demo/','assets/reference/','shop-admin.html','editor.html','data-center.html'
if($bad){$bad|ForEach-Object{Write-Host ('BLOCKER '+$_.Path+':'+$_.LineNumber)};exit 8}
Write-Host 'PASS PUBLIC PACKAGE CONTENT'
exit 0
