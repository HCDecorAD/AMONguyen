@echo off
setlocal EnableExtensions
chcp 65001 >nul
rem ===== HC Shop Engine - deploy (chay trong thu muc shop-engine) =====
cd /d "%~dp0"
echo [1/6] Kiem tra Node va dang nhap Cloudflare...
where node >nul 2>&1 || (echo Thieu Node.js & exit /b 1)
call npx --yes wrangler@4 whoami || (echo Chua dang nhap. Chay: npx wrangler login & exit /b 1)
echo [2/6] Sao luu D1 truoc khi doi...
if not exist backups mkdir backups
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set TS=%%i
call npx wrangler@4 d1 export hcs --remote --config wrangler.toml --output "backups\hcs-%TS%.sql" || (echo Sao luu that bai, dung lai & exit /b 1)
echo [3/6] Ap dung migration (them cot dang nhap theo shop)...
call npx wrangler@4 d1 migrations apply hcs --remote --config wrangler.toml || (echo Migration loi, dung lai & exit /b 1)
echo [4/6] Deploy Worker hc-shop-engine...
call npx wrangler@4 deploy --config wrangler.toml || (echo Deploy loi & exit /b 1)
echo [5/6] Kiem tra suc khoe...
powershell -NoProfile -Command "(Invoke-RestMethod https://hc-shop-engine.huycuongonline.workers.dev/api/health) | ConvertTo-Json -Compress" || exit /b 1
echo [6/6] Xong. Backup: backups\hcs-%TS%.sql
exit /b 0
