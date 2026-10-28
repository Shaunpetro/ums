# assets/render.ps1
# Path: assets/render.ps1
# Rule 41: All bitmap assets are generated from SVG sources via this script.
# Rule 43: kebab-case filenames only.
# Uses inkscape --export-type=png (Inkscape 1.x native CLI). Replaces rsvg-convert.

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$inkscape = "C:\Program Files\Inkscape\bin\inkscape.exe"
if (-not (Test-Path $inkscape)) {
    $inkscape = "C:\Program Files (x86)\Inkscape\bin\inkscape.exe"
}
if (-not (Test-Path $inkscape)) {
    throw "Inkscape not found. Install with: winget install Inkscape.Inkscape"
}
Write-Host "Using: $inkscape"

function Export-Png {
    param([string]$Svg, [int]$Width, [string]$Out)
    $outDir = Split-Path $Out -Parent
    if ($outDir -and -not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
    & $inkscape $Svg --export-type=png --export-filename=$Out --export-width=$Width
    if (-not (Test-Path $Out)) { throw "Export failed: $Out" }
    $size = (Get-Item $Out).Length
    Write-Host ("  -> {0} ({1:N0} bytes)" -f $Out, $size)
}

Write-Host "`n[1/8] App icon 256x256 (preview)"
Export-Png "assets/source/app/icon.svg" 256 "$env:TEMP\ums-icon-preview.png"

Write-Host "[2/8] Tray icon 16x16"
Export-Png "assets/source/app/tray-icon.svg" 16 "src-tauri/icons/tray-16.png"

Write-Host "[3/8] Tray icon 32x32"
Export-Png "assets/source/app/tray-icon.svg" 32 "src-tauri/icons/tray-32.png"

Write-Host "[4/8] Favicon 64x64"
Export-Png "assets/source/branding/favicon.svg" 64 "assets/generated/favicon.png"

Write-Host "[5/8] Wordmark horizontal color 1024"
Export-Png "assets/source/branding/logo-horizontal-color.svg" 1024 "assets/generated/logo-horizontal-color-1024.png"

Write-Host "[6/8] Wordmark horizontal white 1024"
Export-Png "assets/source/branding/logo-horizontal-white.svg" 1024 "assets/generated/logo-horizontal-white-1024.png"

Write-Host "[7/8] Mark vertical color 512"
Export-Png "assets/source/branding/logo-vertical-color.svg" 512 "assets/generated/logo-vertical-color-512.png"

Write-Host "[8/8] Mark vertical white 512"
Export-Png "assets/source/branding/logo-vertical-white.svg" 512 "assets/generated/logo-vertical-white-512.png"

Write-Host "`nAll exports complete."
Write-Host "Preview: $env:TEMP\ums-icon-preview.png"
Write-Host "Generated PNGs: assets\generated\"