param([Parameter(Mandatory=$true)][string]$Root)
$r=(Resolve-Path $Root).Path
$excluded=@('shop-admin.html','editor.html','data-center.html','account.html')
$theme=Join-Path $r 'js\amo-theme.js'
if(-not(Test-Path $theme)){Write-Host 'BLOCKER theme script missing';exit 2}
$pub=Get-ChildItem $r -Recurse -File -Filter *.html|Where-Object{$excluded -notcontains $_.Name}
$bad=$pub|Where-Object{(Get-Content $_.FullName -Raw)-notmatch '(?:\.\./)*js/amo-theme\.js'}
if($bad){$bad|ForEach-Object{Write-Host ('MISSING THEME '+$_.FullName.Substring($r.Length).TrimStart('\'))};exit 3}
$js=Get-Content $theme -Raw
if($js -notmatch 'AMO_THEME'){Write-Host 'BLOCKER AMO_THEME marker missing';exit 4}
Write-Host 'PASS AMO THEME V4'
exit 0
