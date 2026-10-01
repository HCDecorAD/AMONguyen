$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$bad=@()
Get-ChildItem $root -Recurse -Force -File | Where-Object {
  $_.FullName -notmatch '\\.git\\|\\.qa\\|\\scripts\\qa-architecture\.ps1$|\\tools\\amo-github-pages-v4-qa\.bat$'
} | ForEach-Object {
  $rel=$_.FullName.Substring($root.Length+1)
  if($rel -match '(^|\\|/)vercel(\.json|\\|/|$)|\.vercel'){ $bad += $rel; return }
  if($_.Extension -in '.html','.js','.json','.yml','.yaml','.md','.txt','.bat','.ps1'){
    try { $t=[IO.File]::ReadAllText($_.FullName); if($t -match '(?i)vercel\.app|vercel\.com|@vercel/'){ $bad += $rel } } catch {}
  }
}
$cname=(Get-Content (Join-Path $root 'CNAME') -Raw).Trim()
"AMO_ARCH_QA cname=$cname vercelRefs=$($bad.Count)"
$bad|Sort-Object -Unique|ForEach-Object{"VERCEL_REF $_"}
if($cname -ine 'amonguyen.hcdecorhub.com' -or $bad.Count){exit 42}
