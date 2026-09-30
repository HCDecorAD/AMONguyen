param([string]$Base='http://127.0.0.1:18789',[string]$Token=$env:HC_SHOP_TEST_TOKEN)
$ErrorActionPreference='Stop'
function Check($name,$path,$expect,$auth=$false){
 $h=@{'x-store-id'='store_amo'}; if($auth -and $Token){$h.Authorization='Bearer '+$Token}
 try{$r=Invoke-WebRequest ($Base+$path) -Headers $h -UseBasicParsing; $code=[int]$r.StatusCode}catch{$code=[int]$_.Exception.Response.StatusCode}
 if($code -ne $expect){Write-Error "$name expected $expect got $code"}
 Write-Host "PASS $name $code"
}
Check 'health' '/api/health' 200
Check 'catalog' '/api/catalog' 200
$paths=@('/api/v1/stores','/api/v1/brands','/api/v1/categories','/api/v1/product-drafts','/api/v1/products','/api/v1/variants','/api/v1/channels','/api/v1/listings','/api/v1/warehouses','/api/v1/locations','/api/v1/inventory','/api/v1/stock-movements','/api/v1/reservations','/api/v1/orders','/api/v1/import-jobs')
foreach($p in $paths){Check ('deny '+$p) $p 401}
if($Token){foreach($p in $paths){Check ('read '+$p) $p 200 $true}}
Write-Host 'SMOKE V4 PASS'
