@echo off
setlocal EnableExtensions
title AMO ADMIN 4-STEP REAL GATE
set "ROOT=D:\HCDecorHUB"
set "LOG=%ROOT%\TransportMesh\AMO-ADMIN-4STEP.log"
if not exist "%ROOT%\TransportMesh" mkdir "%ROOT%\TransportMesh"
echo ==== AMO ADMIN REAL GATE %date% %time% ====>>"%LOG%"
where powershell.exe >nul 2>&1 || (echo FAIL: PowerShell missing>>"%LOG%" & exit /b 10)
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $u='https://hcdecorhub.com/wp-json/wc/store/v1/products?per_page=100'; try{$p=Invoke-RestMethod -Uri $u -TimeoutSec 30; $amo=@($p|Where-Object {$_.sku -like 'AMO-*'}); Write-Output ('STEP1 ADMIN CATALOG PUBLIC COUNT='+$amo.Count); if($amo.Count -lt 1){exit 21}; $slug=$amo[0].slug; $detail=Invoke-RestMethod -Uri ('https://hcdecorhub.com/wp-json/wc/store/v1/products?slug='+[uri]::EscapeDataString($slug)) -TimeoutSec 30; if(@($detail).Count -lt 1){exit 22}; Write-Output 'STEP2 PRODUCT DETAIL PASS'; $shop=Invoke-WebRequest -Uri 'https://amonguyen.hcdecorhub.com/shop.html' -UseBasicParsing -TimeoutSec 30; if($shop.StatusCode -ne 200){exit 23}; Write-Output 'STEP3 AMO SHOP HTTP PASS'; Write-Output 'STEP4 ORDER ADMIN NOT VERIFIED: requires safe end-to-end order and admin readback'; exit 24}catch{Write-Output ('FAIL '+$_.Exception.Message);exit 25}" >>"%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
type "%LOG%"
if not "%RC%"=="0" echo GATE NOT DONE - RC %RC%
exit /b %RC%
