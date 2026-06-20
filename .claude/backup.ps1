# 프로젝트 루트 = .claude/ 의 상위 폴더
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$backupsDir = Join-Path $root 'backups'
New-Item -ItemType Directory -Force -Path $backupsDir | Out-Null

$count = (Get-ChildItem $backupsDir -Directory -ErrorAction SilentlyContinue).Count + 1
$num   = $count.ToString('D3')
$date  = Get-Date -Format 'yyyyMMdd_HHmmss'
$dest  = Join-Path $backupsDir ($num + '_' + $date)

New-Item -ItemType Directory -Force -Path $dest | Out-Null
Get-ChildItem -Path $root -Exclude backups | Copy-Item -Destination $dest -Recurse
Write-Host "자동 백업 완료: $dest"
