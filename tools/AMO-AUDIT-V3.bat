@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "SITE=C:\Users\DELL\Local Sites\amo-factory-staging\app\public"
set "OUT=D:\HCDecorHUB\TransportMesh\AMO-LocalConfig"
if not exist "%OUT%" mkdir "%OUT%"
set "LOG=%OUT%\audit-v3.log"
> "%LOG%" echo AMO AUDIT V3 - READ ONLY
if not exist "%SITE%\wp-load.php" (>>"%LOG%" echo BLOCK CORE_MISSING & type "%LOG%" & exit /b 21)
where wp >nul 2>&1
if errorlevel 1 (>>"%LOG%" echo BLOCK WP_CLI_NOT_IN_PATH - run from Local Site Shell & type "%LOG%" & exit /b 22)
pushd "%SITE%"
for %%C in ("core is-installed" "theme list --status=active --fields=name,status" "plugin list --fields=name,status" "post list --post_type=page --fields=ID,post_title,post_name,post_status" "post list --post_type=product --fields=ID,post_title,post_status" "menu list --fields=term_id,name,slug" "option get woocommerce_shop_page_id" "option get woocommerce_cart_page_id" "option get woocommerce_checkout_page_id" "option get woocommerce_myaccount_page_id") do (
  >>"%LOG%" echo === %%~C ===
  call wp %%~C >>"%LOG%" 2>&1
  >>"%LOG%" echo ExitCode=!errorlevel!
)
popd
type "%LOG%"
echo AUDIT COMPLETE: %LOG%
endlocal
