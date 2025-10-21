# Quick Deploy Script
# Usage: .\deploy.ps1 "your commit message"

param(
    [string]$message = "Update content"
)

Write-Host "`nStarting deployment..." -ForegroundColor Cyan

# 1. Sync to dist
Write-Host "`nSyncing files to dist..." -ForegroundColor Yellow
Copy-Item index1.0.3.html dist\index.html -Force
Write-Host "Synced: index1.0.3.html -> dist/index.html" -ForegroundColor Green

# 2. Add to Git
Write-Host "`nAdding files to Git..." -ForegroundColor Yellow
git add index1.0.3.html dist/index.html
Write-Host "Files added" -ForegroundColor Green

# 3. Commit
Write-Host "`nCommitting changes..." -ForegroundColor Yellow
git commit -m "$message"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit successful" -ForegroundColor Green
} else {
    Write-Host "No new changes to commit" -ForegroundColor Gray
}

# 4. Push
Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
git push origin master
if ($LASTEXITCODE -eq 0) {
    Write-Host "Push successful!" -ForegroundColor Green
    Write-Host "`nDeployment completed!" -ForegroundColor Green
    Write-Host "Cloudflare Pages will auto-deploy in 1-3 minutes" -ForegroundColor Cyan
    Write-Host "Visit: https://physics-visual.pages.dev" -ForegroundColor Blue
} else {
    Write-Host "Push failed, check network connection" -ForegroundColor Red
}
