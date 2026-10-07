param([string]$Root)
$rootPath=(Resolve-Path $Root).Path
$fail=0
$html=Get-ChildItem $rootPath -File -Filter *.html
foreach($f in $html){
  $s=Get-Content $f.FullName -Raw
  if($f.Name -notin @('404.html','account.html','shop-admin.html','editor.html','data-center.html') -and $s -notmatch '<title>'){ Write-Host ('BLOCKER title '+$f.Name); $fail=1 }
  $matches=[regex]::Matches($s,'href=["'']([^"''#?]+)')
  foreach($m in $matches){
    $h=$m.Groups[1].Value
    if($h -notmatch '^(https?:|mailto:|tel:|javascript:)' -and -not (Test-Path (Join-Path $rootPath $h))){ Write-Host ('BROKEN '+$f.Name+' -> '+$h); $fail=1 }
  }
}
if(-not(Test-Path (Join-Path $rootPath '404.html'))){ Write-Host 'BLOCKER 404'; $fail=1 }
if($fail){ exit 2 }
Write-Host 'PASS LINK + SEO QA'
