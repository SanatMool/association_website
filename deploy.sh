#!/bin/bash
# EVA Nepal — Deployment Script
# Run on the server: bash deploy.sh
# Requires: Node.js 18+, PM2, Nginx

set -e

APP_DIR="/var/www/eva-nepal"
APP_NAME="eva-nepal"

echo "==> Pulling latest code..."
git pull origin main

echo "==> Installing dependencies..."
npm ci --production=false

echo "==> Building Next.js..."
npm run build

echo "==> Restarting PM2 process..."
pm2 restart $APP_NAME || pm2 start ecosystem.config.js

echo "==> Saving PM2 process list..."
pm2 save

echo "==> Done. App running on port 3011."
echo "    Check status: pm2 status"
echo "    Check logs:   pm2 logs eva-nepal"
