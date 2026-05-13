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
        // Allow self-signed cert on https://localhost:5443 (.NET dev API)
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
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
