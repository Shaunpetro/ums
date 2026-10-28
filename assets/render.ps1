# assets/render.ps1
# Path: assets/render.ps1
# Rule 41: All bitmap assets are generated from SVG sources via this script.
# Rule 43: kebab-case filenames only.
# Uses inkscape --export-type=png with --batch-process to avoid Inkscape 1.4 CLI race on Windows.

param(
    [switch]$Diagnose
)

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
Write-Host "Inkscape version:"
& $inkscape --version

function Export-Png {
    param([string]$Svg, [int]$Width, [string]$Out)

    $outDir = Split-Path $Out -Parent
    if ($outDir -and -not (Test-Path $outDir)) {
        New-Item -ItemType Directory -Path $outDir | Out-Null
    }

    # Remove any stale partial output so we know success = this run wrote the file
    if (Test-Path $Out) {
        try { Remove-Item $Out -Force -ErrorAction Stop }
        catch { throw "Cannot remove stale $Out (locked?). Error: $_" }
    }

    # Single-shot Inkscape export with stderr capture
    $stderrFile = [System.IO.Path]::GetTempFileName()
    $stdoutFile = [System.IO.Path]::GetTempFileName()

    $proc = Start-Process -FilePath $inkscape `
        -ArgumentList @($Svg, "--export-type=png", "--export-filename=$Out", "--export-width=$Width", "--batch-process") `
        -Wait -PassThru -NoNewWindow `
        -RedirectStandardError $stderrFile -RedirectStandardOutput $stdoutFile

    $stderr = if (Test-Path $stderrFile) { Get-Content $stderrFile -Raw -ErrorAction SilentlyContinue } else { "" }
    Remove-Item $stderrFile, $stdoutFile -Force -ErrorAction SilentlyContinue

    # Wait for filesystem flush (up to 3 seconds)
    $waited = 0
    while (-not (Test-Path $Out) -and $waited -lt 3000) {
        Start-Sleep -Milliseconds 100
        $waited += 100
    }

    if (-not (Test-Path $Out)) {
        $msg = "Export failed: $Svg -> $Out (width=$Width) exit=$($proc.ExitCode)"
        if ($stderr) { $msg += "`nInkscape stderr: $stderr" }
        throw $msg
    }

    if ($proc.ExitCode -ne 0 -and $Diagnose) {
        Write-Host ("  WARN exit code {0}, stderr: {1}" -f $proc.ExitCode, $stderr)
    }

    $size = (Get-Item $Out).Length
    Write-Host ("  -> {0} ({1:N0} bytes)" -f $Out, $size)

    # Prevent rapid-fire race against next invocation
    Start-Sleep -Milliseconds 150
}

$exports = @(
    @{ Step = "1/8"; Svg = "assets/source/app/icon.svg";                       Width = 256;  Out = "$env:TEMP\ums-icon-preview.png" },
    @{ Step = "2/8"; Svg = "assets/source/app/tray-icon.svg";                  Width = 16;   Out = "src-tauri/icons/tray-16.png" },
    @{ Step = "3/8"; Svg = "assets/source/app/tray-icon.svg";                  Width = 32;   Out = "src-tauri/icons/tray-32.png" },
    @{ Step = "4/8"; Svg = "assets/source/branding/favicon.svg";               Width = 64;   Out = "assets/generated/favicon.png" },
    @{ Step = "5/8"; Svg = "assets/source/branding/logo-horizontal-color.svg"; Width = 1024; Out = "assets/generated/logo-horizontal-color-1024.png" },
    @{ Step = "6/8"; Svg = "assets/source/branding/logo-horizontal-white.svg"; Width = 1024; Out = "assets/generated/logo-horizontal-white-1024.png" },
    @{ Step = "7/8"; Svg = "assets/source/branding/logo-vertical-color.svg";   Width = 512;  Out = "assets/generated/logo-vertical-color-512.png" },
    @{ Step = "8/8"; Svg = "assets/source/branding/logo-vertical-white.svg";   Width = 512;  Out = "assets/generated/logo-vertical-white-512.png" }
)

$failures = @()

foreach ($e in $exports) {
    Write-Host ""
    Write-Host ("[{0}] {1} (width={2})" -f $e.Step, $e.Svg, $e.Width)
    try {
        Export-Png -Svg $e.Svg -Width $e.Width -Out $e.Out
    } catch {
        Write-Host ("  FAIL: {0}" -f $_.Exception.Message) -ForegroundColor Red
        $failures += $e
        if (-not $Diagnose) { throw }
    }
}

Write-Host ""
if ($failures.Count -eq 0) {
    Write-Host "All exports complete." -ForegroundColor Green
    Write-Host "Preview: $env:TEMP\ums-icon-preview.png"
    Write-Host "Generated PNGs: assets\generated\"
} else {
    Write-Host ("{0} of {1} exports failed." -f $failures.Count, $exports.Count) -ForegroundColor Red
    foreach ($f in $failures) { Write-Host ("  - {0} ({1})" -f $f.Out, $f.Svg) }
    exit 1
}