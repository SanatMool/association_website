# EVA Nepal — VPS Production Deployment Guide

## Architecture Overview

```
Browser → Nginx (port 80/443) → Next.js on port 3002 (PM2) → PostgreSQL (localhost:5432)
```

---

## Prerequisites

- Ubuntu 20.04 / 22.04 LTS server
- Domain name pointed to VPS IP (A record: `evanepal.org` → VPS IP)
- SSH access as root or sudo user

---

## Step 1 — Server Packages

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v   # should be v18.x
npm -v

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Git
sudo apt install -y git
```

---

## Step 2 — PostgreSQL Database Setup

```bash
# Switch to postgres system user
sudo -u postgres psql

# Inside psql:
CREATE USER eva_user WITH PASSWORD 'eva2026';
CREATE DATABASE evanepal OWNER eva_user;
GRANT ALL PRIVILEGES ON DATABASE evanepal TO eva_user;
\q
```

Note the credentials — you will need them for `DATABASE_URL`.

---

## Step 3 — Clone the Project

```bash
# Create app directory
sudo mkdir -p /var/www/eva-nepal
sudo chown $USER:$USER /var/www/eva-nepal

# Clone
cd /var/www/eva-nepal
git clone https://github.com/YOUR_USERNAME/eva-nepal.git .
```

---

## Step 4 — Environment Variables

Create `/var/www/eva/.env.local`:

```bash
nano /var/www/eva/.env.local
```

Paste the following (replace every placeholder):

```
DATABASE_URL="postgresql://eva_user:choose-a-strong-password@localhost:5432/evanepal"
NEXTAUTH_URL="https://evanepal.org"
NEXTAUTH_SECRET="paste result of: openssl rand -base64 32"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Generate NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

---

## Step 5 — Install Dependencies & Build

```bash
cd /var/www/eva-nepal

# Install packages
npm ci

# Run database migrations (no prompts — safe for production)
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed the database (first time only)
npx prisma db seed

# Build the Next.js app
npm run build
```

---

## Step 6 — PM2 Process Manager

```bash
# Start the app using the existing PM2 config
pm2 start ecosystem.config.js

# Save PM2 process list (survives reboots)
pm2 save

# Auto-start PM2 on boot
pm2 startup
# Copy and run the sudo command it outputs

# Verify
pm2 status
pm2 logs eva-nepal
```

The app runs on **port 3002** (defined in `ecosystem.config.js`).

---

## Step 7 — Nginx Configuration

```bash
# Copy the config
sudo cp /var/www/eva-nepal/nginx.conf /etc/nginx/sites-available/eva-nepal

# Edit: set real domain
sudo nano /etc/nginx/sites-available/eva-nepal
# Change: server_name _;
# To:     server_name evanepal.org www.evanepal.org;

# Enable the site
sudo ln -s /etc/nginx/sites-available/eva-nepal /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

Visit `http://evanepal.org` — website should appear.

---

## Step 8 — SSL Certificate (HTTPS)

DNS must be pointing to the VPS before this step.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d evanepal.org -d www.evanepal.org
sudo certbot renew --dry-run   # test auto-renewal
```

After this, `https://evanepal.org` will have a valid certificate.

---

## Step 9 — Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Allows: SSH (22), HTTP (80), HTTPS (443). Blocks direct access to port 3002.

---

## Step 10 — Verify

```bash
# App running
pm2 status

# DB has data
psql postgresql://eva_user:password@localhost:5432/evanepal \
  -c 'SELECT COUNT(*) FROM "Member";'
# Should return 155

# Admin panel
# https://evanepal.org/admin/login
# Email: admin@evanepal.org
# Password: admin123  ← change this immediately (see below)
```

---

## Deploying Updates

```bash
cd /var/www/eva-nepal
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 restart eva-nepal
```

Or use the existing deploy script:

```bash
bash deploy.sh
```

---

## Scheduled Upload Cleanup (Cron)

Runs two passes over `public/uploads`:
1. Deletes files that no longer have any database reference (left behind when an image is removed
   or replaced in the admin panel).
2. Finds byte-identical duplicate files and merges each group down to one copy, rewriting every
   record that referenced a duplicate to point at the survivor first. Only merges when every
   reference in the group belongs to the same association — a file referenced identically by two
   different associations is left alone and logged, not merged.

Safe to run on a schedule — files uploaded in the last 24 hours are always skipped, and it only ever
touches `public/uploads`. Can also be run on-demand from the Platform panel → **Storage** page, which
shows a preview before changing anything (separate "Unused Uploads Cleanup" and "Duplicate Images"
panels).

Runs as a separate one-shot process (not inside the PM2-managed app), takes a few seconds total,
and is scheduled for the lowest-traffic hour — negligible server impact. `nice -n 19` additionally
ensures it can never compete with the live app for CPU even if something else is running at the
same time.

Add to the deploy user's crontab (`crontab -e`) to run weekly, e.g. Sunday 3am:

```cron
0 3 * * 0 cd /var/www/eva-nepal && nice -n 19 /usr/bin/npm run cleanup:uploads >> /var/log/eva-nepal-uploads-cleanup.log 2>&1
```

Adjust `/usr/bin/npm` to match `which npm` on the server if different. Test it manually first:

```bash
cd /var/www/eva-nepal
npm run cleanup:uploads
```

**Note: as of 2026-08-31 this cron job has never actually been installed on production** (`crontab -l` shows only the Postgres/arena-manager backup jobs) — add it now if you want orphan/duplicate cleanup running automatically.

---

## Scheduled Upload Backup (Cron) — added after the 2026-08-31 uploads-wipe incident

A bad deploy (`rsync --delete` without `--exclude public/uploads`) once wiped every real
uploaded image on the server in one shot — see the fixed command at the top of this file and
`scripts/backup-uploads.sh`. This cron job tars `public/uploads` into `/var/backups/eva-nepal-uploads/`
daily (a path deploys never touch) so there's always a same-day-or-newer copy to restore from
instead of total loss. Keeps the last 14 days, prunes older ones automatically.

Install:

```bash
chmod +x /var/www/eva-nepal/scripts/backup-uploads.sh
crontab -e
```

Add (runs daily at 1am, before the 3am cleanup job above):

```cron
0 1 * * * /var/www/eva-nepal/scripts/backup-uploads.sh >> /var/log/eva-nepal-uploads-backup.log 2>&1
```

Test manually first:

```bash
/var/www/eva-nepal/scripts/backup-uploads.sh
```

Restore from a backup if needed:

```bash
tar -xzf /var/backups/eva-nepal-uploads/uploads-YYYY-MM-DD.tar.gz -C /var/www/eva-nepal/public/
```

---

## Missing-Upload Report (run after any incident, or any time images seem broken)

Read-only — lists every DB record pointing at an `/uploads/*` file that isn't actually on disk,
so you know exactly what needs re-uploading through the admin panel. See `scripts/report-missing-uploads.ts`.

```bash
cd /var/www/eva-nepal
npm run report:missing-uploads
```

---

## Change Admin Password (Required Before Going Live)

```bash
# Generate bcrypt hash of new password
node -e "const b=require('bcryptjs'); b.hash('YourNewPassword', 10).then(h=>console.log(h))"

# Update in DB
psql postgresql://eva_user:password@localhost:5432/evanepal
UPDATE "AdminUser" SET password = 'PASTE_HASH_HERE', "updatedAt" = now()
  WHERE email = 'admin@evanepal.org';
\q
```

---

## Production Checklist

- [ ] `NEXTAUTH_URL` = `https://evanepal.org` (not localhost)
- [ ] `NEXTAUTH_SECRET` is a strong random 32+ character string
- [ ] `DATABASE_URL` uses the production DB credentials
- [ ] `.env.local` is NOT in git (check `.gitignore`)
- [ ] Admin password changed from `admin123`
- [ ] SSL active (`https://` works)
- [ ] `pm2 startup` run (app restarts on server reboot)
- [ ] Nginx `server_name` set to real domain
- [ ] Firewall enabled (UFW)
- [ ] Real EVA Nepal phone/email/social in Footer and Contact section
- [ ] `favicon.ico` and `og-image.jpg` (1200×630px) in `/public/`

---

## Useful Commands

```bash
pm2 status                       # is the app running?
pm2 restart eva-nepal            # restart after code changes
pm2 logs eva-nepal               # live logs
pm2 logs eva-nepal --lines 100   # last 100 log lines

sudo nginx -t                    # test nginx config syntax
sudo systemctl reload nginx      # reload nginx

npx prisma studio                # DB browser (run on server then SSH tunnel)
```

## Remote DB Access (Prisma Studio via SSH Tunnel)

Run on your local machine:

```bash
ssh -L 5555:localhost:5555 user@YOUR_VPS_IP \
  "cd /var/www/eva && npx prisma studio"
```

Then open `http://localhost:5555` in your browser.

---

## File Locations on Server

| Path                                   | Purpose                              |
| -------------------------------------- | ------------------------------------ |
| `/var/www/eva-nepal/`                  | App root                             |
| `/var/www/eva-nepal/.env.local`        | Environment variables (never commit) |
| `/var/www/eva-nepal/public/uploads/`   | Admin-uploaded images                |
| `/etc/nginx/sites-available/eva-nepal` | Nginx config                         |
| `/var/log/nginx/`                      | Nginx access + error logs            |

## Deploy Command (USE THIS EXACT COMMAND — the --exclude public/uploads is CRITICAL)

Without `--exclude public/uploads`, `--delete` wipes every real admin-uploaded image on the
server and replaces the folder with whatever (if anything) is in your local `public/uploads`
(which is git-ignored and normally empty/stale on your machine). This has happened before —
do not remove that flag.

```bash
rsync -avz --delete --exclude node_modules --exclude .next --exclude .env --exclude .env.local --exclude .git --exclude public/uploads \
  "/Users/sanatmool/Documents/website _ Eva Nepal/" \
  sysadmin@139.59.65.222:/var/www/eva-nepal/
```
