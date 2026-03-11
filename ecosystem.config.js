module.exports = {
	apps: [
		{
			name: "eva-nepal",
			script: "node_modules/.bin/next",
			args: "start -p 3011",
			cwd: "/var/www/eva",
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: "512M",
			env: {
				NODE_ENV: "production",
				PORT: 3011,
			},
			error_file: "/var/log/pm2/eva-error.log",
			out_file: "/var/log/pm2/eva-out.log",
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
		},
	],
};
