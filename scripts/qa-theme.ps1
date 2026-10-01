$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$pages=@('index.html','shop.html','story.html','lookbook.html','guide.html','contact.html','policy.html','cart.html','checkout.html','product.html')
$missing=@()
foreach($p in $pages){$f=Join-Path $root $p;if(!(Test-Path $f) -or !([IO.File]::ReadAllText($f).Contains('js/amo-theme.js'))){$missing+=$p}}
$js=[IO.File]::ReadAllText((Join-Path $root 'js\amo-theme.js'))
$features=@('localStorage','prefers-color-scheme: dark','aria-pressed','data-theme-toggle')
$featureMissing=@($features|?{-not $js.Contains($_)})
"AMO_THEME_QA pages=$($pages.Count) pageMissing=$($missing.Count) featureMissing=$($featureMissing.Count)"
$missing|%{"THEME_PAGE_MISSING $_"};$featureMissing|%{"THEME_FEATURE_MISSING $_"}
if($missing.Count -or $featureMissing.Count){exit 43}
