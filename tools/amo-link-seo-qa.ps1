param([Parameter(Mandatory=$true)][string]$Root)
$rootPath=(Resolve-Path $Root).Path
$fail=0
$excluded=@('404.html','account.html','shop-admin.html','editor.html','data-center.html')
$html=Get-ChildItem $rootPath -File -Filter *.html
foreach($file in $html){
  $s=Get-Content $file.FullName -Raw
  if(($excluded -notcontains $file.Name) -and $s -notmatch '<title>'){ Write-Host ('BLOCKER title '+$file.Name); $fail=1 }
  [regex]::Matches($s,'href=["'']([^"''#?]+)') | ForEach-Object {
    $h=$_.Groups[1].Value
    if($h -notmatch '^(https?:|mailto:|tel:|javascript:)' -and -not(Test-Path (Join-Path $rootPath $h))){
      Write-Host ('BROKEN '+$file.Name+' -> '+$h); $fail=1
    }
  }
}
if(-not(Test-Path (Join-Path $rootPath '404.html'))){ Write-Host 'BLOCKER 404'; $fail=1 }
if($fail){ exit 2 }
Write-Host 'PASS LINK + SEO QA'
exit 0
