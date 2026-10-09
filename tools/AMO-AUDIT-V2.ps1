$ErrorActionPreference='Continue'
$site='C:\Users\DELL\Local Sites\amo-factory-staging\app\public'
$out='D:\HCDecorHUB\TransportMesh\AMO-LocalConfig'
New-Item -ItemType Directory -Force $out | Out-Null
$log=Join-Path $out 'audit-v2.log'
"AMO AUDIT V2 $(Get-Date -Format s)" | Set-Content $log
if(!(Test-Path "$site\wp-load.php")){ "BLOCK: wp-load.php missing" | Tee-Object -FilePath $log -Append; exit 21 }
if(!(Get-Command wp -ErrorAction SilentlyContinue)){ "BLOCK: Open Local Site Shell first (wp unavailable)" | Tee-Object -FilePath $log -Append; exit 22 }
Push-Location $site
try {
 $checks=@(
  @('CORE','core is-installed'),
  @('THEME','theme list --status=active --fields=name,status --format=table'),
  @('PLUGINS','plugin list --fields=name,status --format=table'),
  @('PAGES','post list --post_type=page --fields=ID,post_title,post_name,post_status --format=table'),
  @('SHOP','option get woocommerce_shop_page_id'),
  @('CART','option get woocommerce_cart_page_id'),
  @('CHECKOUT','option get woocommerce_checkout_page_id'),
  @('ACCOUNT','option get woocommerce_myaccount_page_id'),
  @('FRONT','option get page_on_front'),
  @('PERMALINK','option get permalink_structure'),
  @('PRODUCTS','post list --post_type=product --fields=ID,post_title,post_status --format=table'),
  @('MENUS','menu list --fields=term_id,name,slug --format=table')
 )
 foreach($item in $checks){
   "===== $($item[0]) =====" | Tee-Object -FilePath $log -Append
   $parts=$item[1] -split ' '
   $result=& wp @parts 2>&1
   $result | Out-String | Tee-Object -FilePath $log -Append
   "EXIT=$LASTEXITCODE" | Tee-Object -FilePath $log -Append
 }
 "AUDIT_FINISHED_READ_ONLY" | Tee-Object -FilePath $log -Append
} finally { Pop-Location }
