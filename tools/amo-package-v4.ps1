param([Parameter(Mandatory=$true)][string]$Root)
$d=(Resolve-Path $Root).Path
$files=Get-ChildItem $d -Recurse -File -Include *.html,*.js,*.css
$bad=$files|Select-String -SimpleMatch 'assets/reference/','shop-admin.html','editor.html','data-center.html','account.html'
if($bad){$bad|ForEach-Object{Write-Host ('BLOCKER '+$_.Path+':'+$_.LineNumber)};exit 8}
$forbidden=@('shop-admin.html','editor.html','data-center.html','account.html','tools','admin','assets\reference')
foreach($rel in $forbidden){
  $p=Join-Path $d $rel
  if(Test-Path $p){Write-Host ('BLOCKER excluded package path exists: '+$rel);exit 9}
}
Write-Host 'PASS PUBLIC PACKAGE CONTENT'
exit 0
