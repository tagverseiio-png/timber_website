// PM2 process definition — the backend never runs outside pm2.
// Lives in the repo; the VM copy at the same path is kept in sync by deploys.
module.exports = {
  apps: [
    {
      name: "timber-payment",
      script: "src/index.js",
      cwd: "/opt/timber_website/server",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "400M",
      env: { NODE_ENV: "production" },
      out_file: "/var/log/timber-payment/out.log",
      error_file: "/var/log/timber-payment/error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
