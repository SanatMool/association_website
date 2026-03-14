/**
 * PM2 Ecosystem Configuration
 * ---------------------------
 * This file tells PM2 how to start and manage the Next.js application.
 * It controls process management, restart behavior, memory limits, and logging.
 */

module.exports = {
  apps: [
    {
      /*** Application name shown in PM2 process list. */
      name: "eva-nepal",

      /*** Script to run. * We run the Next.js binary directly from node_modules. */
      script: "node_modules/.bin/next",

      /*** Arguments passed to the script. * This starts the Next.js production server on port 3002. */
      args: "start -p 3002",

      /*** Working directory where the app runs. * PM2 will execute commands from this folder.*/
      cwd: "/var/www/eva-nepal",

      /*** Number of app instances to run. * For a 1GB VPS we keep this at 1 to avoid RAM duplication.*/
      instances: 1,

      /*** Automatically restart the app if it crashes.*/
      autorestart: true,

      /*** Disable file watching. * Watching files consumes extra memory and CPU,* so it's disabled for production servers.*/
      watch: false,

      /*** Restart the app automatically if it exceeds this memory usage. * Protects the server from memory leaks or spikes.*/
      max_memory_restart: "400M",

      /*** Environment variables available to the app. * NODE_ENV=production ensures Next.js runs in production mode.*/
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },

      /*** Log files stored inside the project.* This avoids permission issues with /var/log* and keeps logs organized with the app.*/
      error_file: "./logs/error.log",      // errors only
      out_file: "./logs/out.log",          // standard output
      log_file: "./logs/combined.log",     // combined logs
    },
  ],
};