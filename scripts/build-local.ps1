# Path: scripts/build-local.ps1
# Purpose: Local build script to validate code and generate NSIS installer before CI.

$ErrorActionPreference = "Stop"

Write-Host "Setting up signing environment..." -ForegroundColor Cyan
$env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content "E:\Creative Cloud\Design\2026\atg\Dev\Ubuveil UMS\docs\dev\ums.key" -Raw).Trim()
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "P3tr0@398255"

Set-Location "E:\Creative Cloud\Design\2026\atg\Dev\Ubuveil UMS\ums-app"

Write-Host "Starting local Tauri build..." -ForegroundColor Cyan
cargo tauri build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nLocal build successful!" -ForegroundColor Green
    Write-Host "Installer location: ums-app\src-tauri\target\release\bundle\nsis\" -ForegroundColor Yellow
} else {
    Write-Host "`nBuild failed. Fix the errors above before pushing to GitHub." -ForegroundColor Red
}