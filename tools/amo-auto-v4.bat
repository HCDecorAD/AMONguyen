@echo off
setlocal
set "ROOT=%~dp0.."
echo [AMO] V4 QA helper
echo Target: %ROOT%
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$root=(Resolve-Path '%ROOT%').Path; $ext=@('*.html','*.css','*.js','*.json'); $files=Get-ChildItem $root -Recurse -File -Include $ext | Where-Object {$_.FullName -notmatch '\\.git\\|\\dist-public\\|\\vendor\\|\\tools\\|\\admin\\'}; $bad=$files | Select-String -SimpleMatch 'SỈ LẺ','CHÍNH HÃNG'; if($bad){Write-Host ('BLOCKER legacy copy: '+$bad.Count); exit 2}else{Write-Host 'PASS legacy copy'}; $refs=$files | Select-String -SimpleMatch '16.000.000 đ','14.500.000 đ','11.000.000 đ'; if($refs){Write-Host ('BLOCKER demo prices: '+$refs.Count); exit 3}else{Write-Host 'PASS no demo prices'}"
if errorlevel 1 exit /b %errorlevel%
echo PASS AMO V4 QA
