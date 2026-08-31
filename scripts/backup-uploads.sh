#!/bin/bash
# EVA Nepal — public/uploads backup
#
# Tars the live public/uploads directory into a dated archive under a separate path
# (/var/backups/eva-nepal-uploads), outside the app directory that deploys overwrite/sync into.
# Keeps the most recent $KEEP_DAYS archives and deletes older ones.
#
# Exists because a deploy that rsyncs without --exclude public/uploads can wipe every real
# uploaded image in one shot (this happened once — see DEPLOY.md). This won't stop a bad
# deploy from deleting files, but it means there's always a same-day-or-newer copy to restore
# from instead of total loss.
#
# Install (run once on the server):
#   chmod +x /var/www/eva-nepal/scripts/backup-uploads.sh
#   crontab -e
#   # add: 0 1 * * * /var/www/eva-nepal/scripts/backup-uploads.sh >> /var/log/eva-nepal-uploads-backup.log 2>&1
#
# Restore from a backup:
#   tar -xzf /var/backups/eva-nepal-uploads/uploads-YYYY-MM-DD.tar.gz -C /var/www/eva-nepal/public/

set -e

APP_DIR="/var/www/eva-nepal"
BACKUP_DIR="/var/backups/eva-nepal-uploads"
KEEP_DAYS=14
DATE=$(date +%F)

mkdir -p "$BACKUP_DIR"

if [ ! -d "$APP_DIR/public/uploads" ]; then
  echo "[backup-uploads] $(date -u +%FT%TZ) — $APP_DIR/public/uploads does not exist, skipping."
  exit 0
fi

tar -czf "$BACKUP_DIR/uploads-$DATE.tar.gz" -C "$APP_DIR/public" uploads

SIZE=$(du -h "$BACKUP_DIR/uploads-$DATE.tar.gz" | cut -f1)
echo "[backup-uploads] $(date -u +%FT%TZ) — wrote uploads-$DATE.tar.gz ($SIZE)"

find "$BACKUP_DIR" -name "uploads-*.tar.gz" -mtime "+$KEEP_DAYS" -delete
echo "[backup-uploads] $(date -u +%FT%TZ) — pruned archives older than $KEEP_DAYS days"
