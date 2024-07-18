module.exports = {
  apps: [
    {
      name: "portfolio",
      script: "npm",
      args: "start",
      cwd: "/var/www/html/portfolio",
      error_file: "/var/www/html/portfolio/pm2-error.log",
      out_file: "/var/www/html/portfolio/pm2-out.log",
      log_file: "/var/www/html/portfolio/pm2-combined.log",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
