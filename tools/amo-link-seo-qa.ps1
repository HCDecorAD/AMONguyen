param([Parameter(Mandatory=$true)][string]$Root)
$rootPath=(Resolve-Path $Root).Path
$fail=0
$excluded=@('404.html','account.html','shop-admin.html','editor.html','data-center.html')
$html=Get-ChildItem $rootPath -Recurse -File -Filter *.html
foreach($file in $html){
  $s=Get-Content $file.FullName -Raw
  $rel=$file.FullName.Substring($rootPath.Length).TrimStart('\')
  if(($excluded -notcontains $file.Name) -and $s -notmatch '<title>'){Write-Host ('BLOCKER title '+$rel);$fail=1}
  [regex]::Matches($s,'href=["'']([^"''#?]+)')|ForEach-Object{
    $h=$_.Groups[1].Value
    if($h -notmatch '^(https?:|mailto:|tel:|javascript:|/)'){
      $decoded=[uri]::UnescapeDataString($h)
      $target=Join-Path $file.DirectoryName $decoded
      if(-not(Test-Path $target)){Write-Host ('BROKEN '+$rel+' -> '+$h);$fail=1}
    }
  }
}
if(-not(Test-Path (Join-Path $rootPath '404.html'))){Write-Host 'BLOCKER 404';$fail=1}
if($fail){exit 2}
Write-Host 'PASS LINK + SEO QA'
exit 0
