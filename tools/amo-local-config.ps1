param([switch]$Apply)
$ErrorActionPreference='Stop'
$root='D:\HCDecorHUB\TransportMesh\AMO-LocalConfig'
New-Item -ItemType Directory -Force -Path $root | Out-Null
$log=Join-Path $root 'AMO-LOCAL-CONFIG.log'
function Log($m){ $t=(Get-Date -Format s)+' '+$m; Add-Content -Path $log -Value $t; Write-Host $t }
Log 'START: AMO LOCAL CONFIG - preserve theme and Elementor'
$site=$null
$paths=@("$env:USERPROFILE\Local Sites\amo-factory-staging\app\public","$env:USERPROFILE\Local Sites\amo-factory-staging.local\app\public","C:\Users\$env:USERNAME\Local Sites\amo-factory-staging\app\public")
foreach($p in $paths){if(Test-Path (Join-Path $p 'wp-config.php')){$site=$p;break}}
if(-not $site){Log 'BLOCKED: LocalWP WordPress directory not located; no writes';exit 21}
Log ('SITE '+$site)
$wp=Get-Command wp -ErrorAction SilentlyContinue
if(-not $wp){Log 'BLOCKED: WP-CLI unavailable in this process; use LocalWP site shell; no writes';exit 22}
Push-Location $site
try{
 $prefix=@('--path='+$site,'--skip-plugins','--skip-themes')
 $theme=& wp @prefix theme list --status=active --field=name 2>&1
 Log ('ACTIVE THEME '+($theme -join ','))
 if(($theme -join ' ') -notmatch 'shoes'){Log 'BLOCKED: expected Shoes Store theme not active';exit 23}
 $plugins=& wp --path=$site plugin list --status=active --field=name 2>&1
 Log ('ACTIVE PLUGINS '+($plugins -join ','))
 if(($plugins -join ' ') -notmatch 'woocommerce' -or ($plugins -join ' ') -notmatch 'elementor'){Log 'BLOCKED: Elementor/WooCommerce missing';exit 24}
 $pages=& wp --path=$site post list --post_type=page --fields=ID,post_title,post_name,post_status --format=json
 Set-Content -Path (Join-Path $root 'pages.json') -Value ($pages -join "`n") -Encoding UTF8
 $options=@('woocommerce_shop_page_id','woocommerce_cart_page_id','woocommerce_checkout_page_id','woocommerce_myaccount_page_id','show_on_front','page_on_front','permalink_structure')
 $state=@{}
 foreach($o in $options){$state[$o]=((& wp --path=$site option get $o 2>$null) -join '')}
 $state|ConvertTo-Json|Set-Content -Path (Join-Path $root 'settings.json') -Encoding UTF8
 Log ('CONFIG '+($state|ConvertTo-Json -Compress))
 $missing=@($options[0..3]|Where-Object {$state[$_] -notmatch '^[1-9][0-9]*$'})
 if($missing.Count -gt 0){Log ('REVIEW REQUIRED: unbound WooCommerce page IDs: '+($missing -join ','))}
 if(-not $Apply){Log 'CHECK COMPLETE. Read-only mode. Run with -Apply only after review.';exit 0}
 $backup=Join-Path $root ('amo-db-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.sql')
 & wp --path=$site db export $backup
 if($LASTEXITCODE -ne 0){Log 'BLOCKED: database backup failed';exit 25}
 Log ('BACKUP '+$backup)
 $pageNames=@{woocommerce_shop_page_id='shop';woocommerce_cart_page_id='cart';woocommerce_checkout_page_id='checkout';woocommerce_myaccount_page_id='my-account'}
 foreach($key in $missing){
   $slug=$pageNames[$key];$id=((& wp --path=$site post list --post_type=page --name=$slug --post_status=publish --field=ID) -join '').Trim()
   if($id -match '^[1-9][0-9]*$'){ & wp --path=$site option update $key $id | Out-Null; Log ('BOUND '+$key+'='+$id)}
   else{Log ('SKIP '+$key+': matching published page not found')}
 }
 Log 'APPLY FINISHED. Theme, layout, pages, products not modified.'
}finally{Pop-Location}
