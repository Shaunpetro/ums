# Path: scripts/release-github.ps1
# Purpose: Automates git commit and tag push to trigger the GitHub Actions release pipeline.

param (
    [Parameter(Mandatory=$true)]
    [string]$Version,
    [string]$CommitMessage = "feat: release v$Version"
)

$ErrorActionPreference = "Stop"
Set-Location "E:\Creative Cloud\Design\2026\atg\Dev\Ubuveil UMS"

Write-Host "Committing changes..." -ForegroundColor Cyan
git add .
git commit -m $CommitMessage
git push origin stage/02-installer-updates

Write-Host "Tagging release app-v$Version..." -ForegroundColor Cyan
git tag "app-v$Version"
git push origin "app-v$Version"

Write-Host "`nRelease pushed to GitHub!" -ForegroundColor Green
Write-Host "Monitor the build at: https://github.com/Shaunpetro/ums/actions" -ForegroundColor Yellow