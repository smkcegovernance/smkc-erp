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
