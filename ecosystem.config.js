module.exports = {
  apps: [
    {
      name: "jsvmp",
      script: "./start.js",
      cwd: "/data/cy_jsvmp-main新",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 8080,
      },
    },
  ],
};
