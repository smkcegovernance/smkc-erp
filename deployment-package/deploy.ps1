# ============================================
# DEPLOYMENT SCRIPT FOR WINDOWS SERVER 2012 R2
# SMKC ERP - smkc-erp-shell + deposit-manager
#
# HOW TO RUN (if execution policy blocks the script):
#   Option A - allow local scripts (run once, as Administrator):
#     Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#     .\deploy.ps1
#
#   Option B - bypass for this run only:
#     powershell -ExecutionPolicy Bypass -File .\deploy.ps1
#
# Run from the deployment-package folder on the server:
#   cd C:\smkc-erp
#   .\deploy.ps1
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SMKC ERP DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verify expected structure
$missingItems = @()
if (-not (Test-Path "apps\smkc-erp-shell\.next")) { $missingItems += "apps\smkc-erp-shell\.next" }
if (-not (Test-Path "apps\deposit-manager\.next")) { $missingItems += "apps\deposit-manager\.next" }
if (-not (Test-Path "ecosystem.config.js"))        { $missingItems += "ecosystem.config.js" }

if ($missingItems.Count -gt 0) {
    Write-Host "ERROR: Missing required files:" -ForegroundColor Red
    foreach ($item in $missingItems) {
        Write-Host "    MISSING: $item" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Make sure you copied the full deployment-package folder to this server." -ForegroundColor Yellow
    exit 1
}

# -----------------------------------------------
# Step 1: Check prerequisites
# -----------------------------------------------
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow

$nodeVersion = node -v 2>$null
if (-not $nodeVersion) {
    Write-Host "  ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "  Install Node.js 20.x from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
$nodeMajorVersion = [int]($nodeVersion -replace "v(\d+)\..*", '$1')
if ($nodeMajorVersion -lt 20) {
    Write-Host "  ERROR: Node.js $nodeVersion is too old. Need 20.x or higher." -ForegroundColor Red
    exit 1
}
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green

$pm2Version = pm2 -v 2>$null
if (-not $pm2Version) {
    Write-Host "  ERROR: PM2 not found!" -ForegroundColor Red
    Write-Host "  Install with: npm install -g pm2" -ForegroundColor Yellow
    exit 1
}
Write-Host "  PM2: v$pm2Version" -ForegroundColor Green

# -----------------------------------------------
# Step 2: Check / copy env files
# -----------------------------------------------
Write-Host ""
Write-Host "[2/5] Checking environment files..." -ForegroundColor Yellow

if (-not (Test-Path "apps\smkc-erp-shell\.env.production")) {
    if (Test-Path ".env.shell.production") {
        Copy-Item ".env.shell.production" "apps\smkc-erp-shell\.env.production"
        Write-Host "  Copied .env.shell.production -> apps\smkc-erp-shell\.env.production" -ForegroundColor Yellow
        Write-Host "  !! UPDATE API keys in apps\smkc-erp-shell\.env.production before going live !!" -ForegroundColor Red
    } else {
        Write-Host "  WARNING: No .env.production for smkc-erp-shell - using defaults" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Shell .env.production OK" -ForegroundColor Green
}

if (-not (Test-Path "apps\deposit-manager\.env.production")) {
    if (Test-Path ".env.deposit.production") {
        Copy-Item ".env.deposit.production" "apps\deposit-manager\.env.production"
        Write-Host "  Copied .env.deposit.production -> apps\deposit-manager\.env.production" -ForegroundColor Yellow
        Write-Host "  !! UPDATE API keys in apps\deposit-manager\.env.production before going live !!" -ForegroundColor Red
    } else {
        Write-Host "  WARNING: No .env.production for deposit-manager - using defaults" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Deposit Manager .env.production OK" -ForegroundColor Green
}

# -----------------------------------------------
# Step 3: Stop existing applications
# -----------------------------------------------
Write-Host ""
Write-Host "[3/5] Stopping existing applications..." -ForegroundColor Yellow
pm2 stop   smkc-erp-shell        2>$null | Out-Null
pm2 stop   smkc-deposit-manager  2>$null | Out-Null
pm2 delete smkc-erp-shell        2>$null | Out-Null
pm2 delete smkc-deposit-manager  2>$null | Out-Null
Write-Host "  Stopped" -ForegroundColor Green

# -----------------------------------------------
# Step 4: Install runtime dependencies for each app
# -----------------------------------------------
Write-Host ""
Write-Host "[4/5] Installing dependencies..." -ForegroundColor Yellow
npm config set ignore-scripts false
npm config set engine-strict false

# smkc-erp-shell
Write-Host "  Installing smkc-erp-shell dependencies..." -ForegroundColor Cyan
Push-Location "apps\smkc-erp-shell"
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue }
npm install --legacy-peer-deps --omit=dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: smkc-erp-shell npm install failed!" -ForegroundColor Red
    Pop-Location; exit 1
}
Pop-Location
Write-Host "  smkc-erp-shell dependencies OK" -ForegroundColor Green

# deposit-manager
Write-Host "  Installing deposit-manager dependencies..." -ForegroundColor Cyan
Push-Location "apps\deposit-manager"
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue }
npm install --legacy-peer-deps --omit=dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: deposit-manager npm install failed!" -ForegroundColor Red
    Pop-Location; exit 1
}
Pop-Location
Write-Host "  deposit-manager dependencies OK" -ForegroundColor Green

# -----------------------------------------------
# Step 5: Start with PM2
# -----------------------------------------------
Write-Host ""
Write-Host "[5/5] Starting applications with PM2..." -ForegroundColor Yellow

if (-not (Test-Path "logs")) { New-Item -ItemType Directory -Path "logs" | Out-Null }

pm2 start ecosystem.config.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: PM2 failed to start!" -ForegroundColor Red
    Write-Host "  Check logs: pm2 logs" -ForegroundColor Yellow
    exit 1
}

pm2 save | Out-Null
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Application Status:" -ForegroundColor Cyan
pm2 list
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  ERP Shell:        http://localhost:3000" -ForegroundColor White
Write-Host "  Deposit Manager:  http://localhost:3000/depositmanager" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  All logs:         pm2 logs" -ForegroundColor White
Write-Host "  Shell logs:       pm2 logs smkc-erp-shell" -ForegroundColor White
Write-Host "  Deposit logs:     pm2 logs smkc-deposit-manager" -ForegroundColor White
Write-Host "  Status:           pm2 status" -ForegroundColor White
Write-Host "  Restart all:      pm2 restart all" -ForegroundColor White
Write-Host "  Monitor:          pm2 monit" -ForegroundColor White
Write-Host ""
