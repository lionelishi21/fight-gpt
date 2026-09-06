module.exports = {
  apps: [
    {
      name: 'fightgpt-api',
      script: 'dist/index.js',
      instances: 'max',       // use all CPU cores
      exec_mode: 'cluster',
      listen_timeout: 10000,
      kill_timeout: 5000,

      // Restart policy
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,

      // Memory limit — restart if over 512MB
      max_memory_restart: '512M',

      // Logging
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Watch (disabled in prod — deploy script handles restarts)
      watch: false,

      // Source maps for better stack traces
      source_map_support: true,
    },
    {
      name: 'fightgpt-worker',
      script: 'dist/worker.js',
      instances: 1, // Workers should typically run in solo mode to avoid Redis lock contention
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '1G', // Video analysis is memory intensive
      out_file: 'logs/worker-out.log',
      error_file: 'logs/worker-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env_production: {
        NODE_ENV: 'production',
      },
      watch: false,
      source_map_support: true,
    },
    {
      name: 'fightgpt-discord',
      script: 'dist/discord/bot.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      max_memory_restart: '256M',
      out_file: 'logs/discord-out.log',
      error_file: 'logs/discord-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env_production: {
        NODE_ENV: 'production',
      },
      watch: false,
      source_map_support: true,
    },
    {
      name: 'fgsm-vision-engine',
      script: '../fgsm-vision-engine/src/api.py',
      interpreter: '../fgsm-vision-engine/.venv/bin/python',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '2G',
      out_file: 'logs/fgsm-out.log',
      error_file: 'logs/fgsm-error.log',
      merge_logs: true,
      env_production: {
        PORT: 8000,
      }
    },
  ],
};
