$ErrorActionPreference='Stop'
$base='https://amonguyen.hcdecorhub.com'
$paths=@('/','/shop.html','/story.html','/lookbook.html','/guide.html','/css/amo-style.css','/CNAME')
$failed=@()
foreach($p in $paths){try{$r=Invoke-WebRequest -UseBasicParsing -Uri ($base+$p) -TimeoutSec 20;$len=if($r.RawContentLength){$r.RawContentLength}else{$r.Content.Length};"AMO_PROD $($r.StatusCode) bytes=$len $p";if($r.StatusCode -ne 200 -or $len -lt 10){$failed+=$p}}catch{"AMO_PROD FAIL $p $($_.Exception.Message)";$failed+=$p}}
"AMO_PROD_SMOKE total=$($paths.Count) failed=$($failed.Count)"
if($failed.Count){exit 40}
