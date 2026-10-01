@echo off
setlocal
set "ROOT=%~dp0.."
echo === AMO LINK + SEO QA ===
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$root=(Resolve-Path '%ROOT%').Path;$fail=0;$html=Get-ChildItem $root -File -Filter *.html; foreach($f in $html){$s=Get-Content $f.FullName -Raw; if($f.Name -notin @('404.html','account.html','shop-admin.html','editor.html','data-center.html') -and $s -notmatch '<title>'){Write-Host ('BLOCKER title '+$f.Name);$fail=1}; [regex]::Matches($s,'href=["'']([^"''#?]+)')|ForEach-Object{$h=$_.Groups[1].Value;if($h -notmatch '^(https?:|mailto:|tel:|javascript:)' -and -not (Test-Path (Join-Path $root $h))){Write-Host ('BROKEN '+$f.Name+' -> '+$h);$fail=1}}}; if(-not(Test-Path (Join-Path $root '404.html'))){Write-Host 'BLOCKER 404';$fail=1}; if($fail){exit 2};Write-Host 'PASS LINK + SEO QA'"
exit /b %errorlevel%
