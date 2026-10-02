@echo off
setlocal
set "ROOT=%~dp0.."
echo === AMO RC V4 GATE ===
call "%~dp0amo-auto-v4.bat" || exit /b 2
call "%~dp0amo-public-qa.bat" || exit /b 3
call "%~dp0amo-build-public-v4.bat" || exit /b 4
call "%~dp0amo-public-qa.bat" "%ROOT%\dist-public" || exit /b 5
call "%~dp0amo-link-seo-qa.bat" "%ROOT%\dist-public" || exit /b 6
call "%~dp0amo-theme-v4.bat" "%ROOT%\dist-public" || exit /b 7
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0amo-package-v4.ps1" -Root "%ROOT%\dist-public" || exit /b 8
echo PASS AMO PUBLIC V4 RC GATE
exit /b 0
