@echo off
setlocal
set "ROOT=%~dp0.."
set "DST=%ROOT%\assets\amo"
set "SRC=%ROOT%\asset-pack"
echo === AMO OFFICIAL ASSET PACK ===
if not exist "%SRC%" (
  echo Put supplied AMO asset pack in: %SRC%
  exit /b 2
)
if not exist "%DST%" mkdir "%DST%"
robocopy "%SRC%" "%DST%" /E /R:2 /W:1 /NFL /NDL /NP
if errorlevel 8 exit /b 3
echo PASS asset staging
