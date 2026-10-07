param([string]$Root)
$r=(Resolve-Path $Root).Path
$exclude=@('account.html','data-center.html','editor.html','shop-admin.html')
$bad=Get-ChildItem $r -File -Filter *.html | Where-Object { $_.Name -notin $exclude -and (Get-Content $_.FullName -Raw) -notmatch 'js/amo-theme.js' }
if($bad){ $bad | ForEach-Object { Write-Host ('MISSING THEME '+$_.Name) }; exit 3 }
$js=Get-Content (Join-Path $r 'js\amo-theme.js') -Raw
if($js -notmatch 'AMO_THEME'){ exit 4 }
Write-Host 'PASS AMO THEME V4'
