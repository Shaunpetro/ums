# Path: C:\ums-autentico\scripts\setup-server.ps1
# Purpose: Automates server setup (Firewall, NSSM Service, LAN IP check) for Autentico.

$ErrorActionPreference = "Stop"

# 1. Verify Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {   
    Write-Warning "Please run this script as Administrator!"
    Exit
}

Write-Host "--- Autentico Server Setup ---" -ForegroundColor Cyan

# 2. Open Firewall for LAN Clients
Write-Host "Configuring Windows Firewall for port 8080..."
$ruleName = "Autentico LAN Auth"
if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8080 | Out-Null
    Write-Host "  [OK] Firewall rule created." -ForegroundColor Green
} else {
    Write-Host "  [SKIP] Firewall rule already exists." -ForegroundColor Yellow
}

# 3. Identify LAN IP
Write-Host "`nDetecting LAN IP Address..."
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -ne 'WellKnown' -and $_.IPAddress -notlike '127.*' }).IPAddress | Select-Object -First 1
if ($lanIp) {
    Write-Host "  [OK] This server's LAN IP is: $lanIp" -ForegroundColor Green
    Write-Host "  ACTION REQUIRED: Ensure UMS clients point to http://${lanIp}:8080" -ForegroundColor Magenta
} else {
    Write-Host "  [WARN] Could not detect a LAN IP. Check network connection." -ForegroundColor Red
}

# 4. Install as Windows Service via NSSM
Write-Host "`nConfiguring Windows Service (NSSM)..."
if (-not (Get-Command nssm -ErrorAction SilentlyContinue)) {
    Write-Host "  NSSM not found. Installing via winget..."
    winget install NSSM.NSSM --accept-source-agreements --accept-package-agreements | Out-Null
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

$exePath = Resolve-Path "..\autentico.exe"
if (Get-Service -Name "Autentico" -ErrorAction SilentlyContinue) {
    Write-Host "  Stopping existing Autentico service..."
    nssm stop Autentico | Out-Null
    nssm remove Autentico confirm | Out-Null
}

nssm install Autentico "$exePath" serve | Out-Null
nssm set Autentico AppDirectory "C:\ums-autentico" | Out-Null
nssm set Autentico AppStdout "C:\ums-autentico\autentico.log" | Out-Null
nssm set Autentico AppStderr "C:\ums-autentico\autentico.log" | Out-Null

Write-Host "  Starting service..."
nssm start Autentico | Out-Null

Write-Host "`n--- Setup Complete ---" -ForegroundColor Cyan
Write-Host "Autentico is now running as a background Windows Service."
Write-Host "Logs: C:\ums-autentico\autentico.log"