# ============================================
# PREPARE DEPLOYMENT PACKAGE - SMKC ERP
# Run this script from the smkc-erp root on your DEV machine.
#
# What it does:
#   1. Builds smkc-erp-shell and deposit-manager
#   2. Packages .next + public + slim package.json for each app
#   3. Creates deployment-package\ ready to copy to the server
#
# Usage:
#   cd C:\Users\ACER\source\repos\SMKC-ERP\smkc-erp
#   .\prepare-deployment.ps1
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SMKC ERP - PREPARE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------
# Verify we are at the monorepo root
# -----------------------------------------------
if (-not (Test-Path "package.json") -or -not (Test-Path "apps")) {
    Write-Host "ERROR: Run this script from the smkc-erp root directory!" -ForegroundColor Red
    exit 1
}

# -----------------------------------------------
# Step 1: Install dependencies
# -----------------------------------------------
Write-Host "[1/5] Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Dependencies OK" -ForegroundColor Green

# -----------------------------------------------
# Step 2: Build both apps
# -----------------------------------------------
Write-Host ""
Write-Host "[2/5] Building smkc-erp-shell..." -ForegroundColor Yellow
npm run build --workspace=apps/smkc-erp-shell
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: smkc-erp-shell build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  smkc-erp-shell built OK" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Building deposit-manager..." -ForegroundColor Yellow
npm run build --workspace=apps/deposit-manager
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: deposit-manager build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  deposit-manager built OK" -ForegroundColor Green

# -----------------------------------------------
# Step 4: Create deployment-package folder
# -----------------------------------------------
Write-Host ""
Write-Host "[4/5] Creating deployment-package..." -ForegroundColor Yellow

$deployFolder = ".\deployment-package"
if (Test-Path $deployFolder) {
    Remove-Item -Recurse -Force $deployFolder
}
New-Item -ItemType Directory -Path "$deployFolder\apps\smkc-erp-shell" -Force | Out-Null
New-Item -ItemType Directory -Path "$deployFolder\apps\deposit-manager"  -Force | Out-Null
New-Item -ItemType Directory -Path "$deployFolder\logs" -Force | Out-Null

# --- smkc-erp-shell ---
Write-Host "  Packaging smkc-erp-shell..." -ForegroundColor Cyan

# .next build output (required to run 'next start')
Copy-Item -Path "apps\smkc-erp-shell\.next" -Destination "$deployFolder\apps\smkc-erp-shell\.next" -Recurse

# public assets
if (Test-Path "apps\smkc-erp-shell\public") {
    Copy-Item -Path "apps\smkc-erp-shell\public" -Destination "$deployFolder\apps\smkc-erp-shell\public" -Recurse
}

# next.config.ts (needed by next start for headers/rewrites)
Copy-Item -Path "apps\smkc-erp-shell\next.config.ts" -Destination "$deployFolder\apps\smkc-erp-shell\next.config.ts"

# Slim package.json: only runtime deps, strip @smkc/* workspace packages
$shellPkg = Get-Content "apps\smkc-erp-shell\package.json" -Raw | ConvertFrom-Json
$slimShellDeps = [ordered]@{}
foreach ($prop in $shellPkg.dependencies.PSObject.Properties) {
    if ($prop.Name -notlike '@smkc/*' -and $prop.Name -notmatch '^@smkc/') {
        $slimShellDeps[$prop.Name] = $prop.Value
    }
}
$slimShellPkg = [ordered]@{
    name         = $shellPkg.name
    version      = $shellPkg.version
    private      = $true
    scripts      = [ordered]@{ start = "next start" }
    dependencies = $slimShellDeps
}
$slimShellPkg | ConvertTo-Json -Depth 5 | Set-Content "$deployFolder\apps\smkc-erp-shell\package.json" -Encoding UTF8

# --- deposit-manager ---
Write-Host "  Packaging deposit-manager..." -ForegroundColor Cyan

# .next build output
Copy-Item -Path "apps\deposit-manager\.next" -Destination "$deployFolder\apps\deposit-manager\.next" -Recurse

# public assets (if any)
if (Test-Path "apps\deposit-manager\public") {
    Copy-Item -Path "apps\deposit-manager\public" -Destination "$deployFolder\apps\deposit-manager\public" -Recurse
}

# next.config.ts
Copy-Item -Path "apps\deposit-manager\next.config.ts" -Destination "$deployFolder\apps\deposit-manager\next.config.ts"

# postcss (needed by tailwind at runtime in some setups)
if (Test-Path "apps\deposit-manager\postcss.config.mjs") {
    Copy-Item -Path "apps\deposit-manager\postcss.config.mjs" -Destination "$deployFolder\apps\deposit-manager\postcss.config.mjs"
}

# Slim package.json: only runtime deps, no devDependencies
$depositPkg = Get-Content "apps\deposit-manager\package.json" -Raw | ConvertFrom-Json
$slimDepositDeps = [ordered]@{}
foreach ($prop in $depositPkg.dependencies.PSObject.Properties) {
    $slimDepositDeps[$prop.Name] = $prop.Value
}
$slimDepositPkg = [ordered]@{
    name         = $depositPkg.name
    version      = $depositPkg.version
    private      = $true
    scripts      = [ordered]@{ start = "next start -p 3002" }
    dependencies = $slimDepositDeps
}
$slimDepositPkg | ConvertTo-Json -Depth 5 | Set-Content "$deployFolder\apps\deposit-manager\package.json" -Encoding UTF8

# deposit-manager web.config (app-level IIS config)
if (Test-Path "apps\deposit-manager\web.config") {
    Copy-Item -Path "apps\deposit-manager\web.config" -Destination "$deployFolder\apps\deposit-manager\web.config"
}

# --- Root deployment files ---
Write-Host "  Copying deployment scripts..." -ForegroundColor Cyan
Copy-Item -Path "deployment-package-src\ecosystem.config.js" -Destination "$deployFolder\ecosystem.config.js" -ErrorAction SilentlyContinue
Copy-Item -Path "deployment-package-src\deploy.ps1"          -Destination "$deployFolder\deploy.ps1"          -ErrorAction SilentlyContinue
Copy-Item -Path "deployment-package-src\web.config"          -Destination "$deployFolder\web.config"          -ErrorAction SilentlyContinue

# Root IIS web.config (written directly so this script is self-contained)
@'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <clear />
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
      <add name="StaticFile" path="*" verb="*" modules="ProtocolSupportModule"
           resourceType="Unspecified" requireAccess="None" />
    </handlers>
    <rewrite>
      <allowedServerVariables>
        <add name="HTTP_X_FORWARDED_PROTO" />
        <add name="HTTP_X_FORWARDED_HOST" />
      </allowedServerVariables>
      <rules>
        <rule name="ProxyToDepositManager" stopProcessing="true">
          <match url="^depositmanager($|/.*)" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_PROTO" value="https" />
            <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
          </serverVariables>
          <action type="Rewrite" url="http://localhost:3002/{R:0}" logRewrittenUrl="true" appendQueryString="true" />
        </rule>
        <rule name="ProxyToErpShell" stopProcessing="true">
          <match url=".*" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_PROTO" value="https" />
            <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
          </serverVariables>
          <action type="Rewrite" url="http://localhost:3000/{R:0}" logRewrittenUrl="true" appendQueryString="true" />
        </rule>
      </rules>
    </rewrite>
    <httpErrors existingResponse="PassThrough" />
    <directoryBrowse enabled="false" />
  </system.webServer>
</configuration>
'@ | Set-Content "$deployFolder\web.config" -Encoding UTF8

# --- .env production templates ---
@"
# ERP Shell - production environment variables
# This file is automatically placed at apps\smkc-erp-shell\.env.production by deploy.ps1

# Backend .NET API base URL (no trailing slash)
SMKC_API_BASE_URL=https://localhost:5443
ALLOW_INSECURE_LOCALHOST_TLS=true

# HMAC authentication keys (matches built-in apismkc test keys)
SMKC_API_KEY=TEST_API_KEY_12345678901234567890123456789012
SMKC_SECRET_KEY=TEST_SECRET_KEY_67890ABCDEFGHIJ1234567890
"@ | Set-Content "$deployFolder\.env.shell.production" -Encoding UTF8

@"
# Deposit Manager - production environment variables
# This file is automatically placed at apps\deposit-manager\.env.production by deploy.ps1

# Backend .NET API base URL (no trailing slash)
BASE_URL=https://localhost:5443/api
ALLOW_INSECURE_LOCALHOST_TLS=true

# HMAC authentication keys (matches built-in apismkc test keys)
API_KEY=TEST_API_KEY_12345678901234567890123456789012
SECRET_KEY=TEST_SECRET_KEY_67890ABCDEFGHIJ1234567890
"@ | Set-Content "$deployFolder\.env.deposit.production" -Encoding UTF8

# --- ecosystem.config.js (written directly so this script is self-contained) ---
@'
// PM2 ecosystem configuration - SMKC ERP
// Each app has its own node_modules installed by deploy.ps1
module.exports = {
  apps: [
    {
      name: 'smkc-erp-shell',
      cwd: './apps/smkc-erp-shell',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      error_file: '../../logs/shell-err.log',
      out_file: '../../logs/shell-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'smkc-deposit-manager',
      cwd: './apps/deposit-manager',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        HOSTNAME: '0.0.0.0',
      },
      error_file: '../../logs/deposit-err.log',
      out_file: '../../logs/deposit-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
'@ | Set-Content "$deployFolder\ecosystem.config.js" -Encoding UTF8

# --- web.config (IIS root proxy for shell + deposit-manager) ---
@'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <clear />
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
      <add name="StaticFile" path="*" verb="*" modules="ProtocolSupportModule"
           resourceType="Unspecified" requireAccess="None" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="ProxyToDepositManager" stopProcessing="true">
          <match url="^depositmanager(/.*)?$" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_PROTO" value="https" />
            <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
          </serverVariables>
          <action type="Rewrite" url="http://localhost:3002/{R:0}" logRewrittenUrl="true" appendQueryString="true" />
        </rule>
        <rule name="ProxyToErpShell" stopProcessing="true">
          <match url=".*" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_PROTO" value="https" />
            <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
          </serverVariables>
          <action type="Rewrite" url="http://localhost:3000/{R:0}" logRewrittenUrl="true" appendQueryString="true" />
        </rule>
      </rules>
    </rewrite>
    <httpErrors existingResponse="PassThrough" />
    <directoryBrowse enabled="false" />
  </system.webServer>
</configuration>
'@ | Set-Content "$deployFolder\web.config" -Encoding UTF8

# --- deploy.ps1 (written directly so this script is fully self-contained) ---
@'
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
'@ | Set-Content "$deployFolder\deploy.ps1" -Encoding UTF8

# --- README.txt ---
@"
SMKC ERP - Deployment Instructions
====================================

PREREQUISITES
-------------
1. Node.js 20.x LTS      https://nodejs.org/
2. PM2:
     npm install -g pm2
     npm install -g pm2-windows-startup
     pm2-startup install


STEP 1 - Allow PowerShell scripts (first time only, run as Administrator)
--------------------------------------------------------------------------
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

   Or one-time bypass:
   powershell -ExecutionPolicy Bypass -File .\deploy.ps1


STEP 2 - Copy this deployment-package folder to the server
------------------------------------------------------------
   e.g.  C:\smkc-erp\


STEP 3 - Update production API keys
--------------------------------------
   Edit .env.shell.production:
     SMKC_API_BASE_URL  = production API URL
     SMKC_API_KEY       = production API key
     SMKC_SECRET_KEY    = production secret

   Edit .env.deposit.production:
     BASE_URL   = production API URL
     API_KEY    = production API key
     SECRET_KEY = production secret

   deploy.ps1 copies these automatically to the correct app folders.


STEP 4 - Run deployment script
-------------------------------
   cd C:\smkc-erp
   .\deploy.ps1

   The script will:
   - Check Node.js 20+ and PM2
   - Copy env files to each app
   - Install runtime npm deps for each app (no build needed - already built)
   - Start both apps via PM2


STEP 5 - Open firewall ports
------------------------------
   New-NetFirewallRule -DisplayName "SMKC ERP Shell"    -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "SMKC ERP Deposit"  -Direction Inbound -LocalPort 3002 -Protocol TCP -Action Allow


URLS
----
   ERP Shell:        http://localhost:3000
   Deposit Manager:  http://localhost:3000/depositmanager


PM2 COMMANDS
------------
   pm2 status
   pm2 logs
   pm2 logs smkc-erp-shell
   pm2 logs smkc-deposit-manager
   pm2 restart all
   pm2 stop all
   pm2 monit


TROUBLESHOOTING
---------------
   Script blocked      ->  See STEP 1 (execution policy)
   Apps not starting   ->  pm2 logs
   Port in use         ->  netstat -ano | findstr :3000
   PM2 not auto-start  ->  pm2-startup install  then  pm2 save
"@ | Set-Content "$deployFolder\README.txt" -Encoding UTF8

Write-Host "  deployment-package created" -ForegroundColor Green

# -----------------------------------------------
# Step 5: Summary
# -----------------------------------------------
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT PACKAGE READY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $((Resolve-Path $deployFolder).Path)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Edit deployment-package\.env.shell.production   with production API keys" -ForegroundColor White
Write-Host "  2. Edit deployment-package\.env.deposit.production with production API keys" -ForegroundColor White
Write-Host "  3. Copy the deployment-package\ folder to C:\smkc-erp\ on the server" -ForegroundColor White
Write-Host "  4. On the server run: .\deploy.ps1" -ForegroundColor White
Write-Host ""
