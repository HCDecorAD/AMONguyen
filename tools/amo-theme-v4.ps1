param([Parameter(Mandatory=$true)][string]$Root)
$r=(Resolve-Path $Root).Path
$excluded=@('shop-admin.html','editor.html','data-center.html','account.html')
$pub=Get-ChildItem $r -File -Filter *.html | Where-Object { $excluded -notcontains $_.Name }
$bad=$pub | Where-Object { (Get-Content $_.FullName -Raw) -notmatch 'js/amo-theme.js' }
if($bad){ $bad | ForEach-Object { Write-Host ('MISSING THEME '+$_.Name) }; exit 3 }
$js=Get-Content (Join-Path $r 'js\amo-theme.js') -Raw
if($js -notmatch 'AMO_THEME'){ exit 4 }
Write-Host 'PASS AMO THEME V4'
exit 0
