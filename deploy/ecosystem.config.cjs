module.exports = {
  apps: [
    {
      name: 'sua-barbearia-api',
      cwd: './apps/backend',
      script: 'dist/main.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 7192,
      },
    },
  ],
}
