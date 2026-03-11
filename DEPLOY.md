# Deployment Guide — Vitara Balgram

## Local Development

| Task                       | Command         |
| -------------------------- | --------------- |
| Dev server                 | `npm run dev`   |
| Production build           | `npm run build` |
| Preview production locally | `npm start`     |
| Lint                       | `npm run lint`  |

Visit `http://localhost:3000` after running `npm run dev`.

---

## Deploy to Digital Ocean (Ubuntu 22.04)

### Prerequisites

- A Digital Ocean droplet running Ubuntu 22.04
- A domain (`vitarabalgram.com`) pointed to the droplet's IP via DNS A records

---

### Step 1 — Install Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should print v20.x.x
```

### Step 2 — Install PM2 and Nginx

```bash
sudo npm install -g pm2
sudo apt install -y nginx
```

### Step 3 — Upload the Project

**Option A — Git clone** (if repo is on GitHub/GitLab):

```bash
git clone <repo-url> /var/www/eva
```

**Option B — rsync from local machine**:

```bash
rsync -avz --exclude node_modules --exclude .next . user@<droplet-ip>:/var/www/eva
```

### Step 4 — Build the App

```bash
cd /var/www/eva
npm install
npm run build
```

### Step 5 — Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # copy and run the printed command to enable on reboot
```

Verify the app is running:

```bash
pm2 status
curl http://localhost:3011  # should return HTML
```

### Step 6 — Configure Nginx

```bash
sudo cp /var/www/eva/nginx-site.conf /etc/nginx/sites-available/eva
sudo ln -s /etc/nginx/sites-available/eva /etc/nginx/sites-enabled/
sudo nginx -t        # test config — should say "ok"
sudo systemctl reload nginx
```

Visit `https://eva.nibjar.com` — the site should load.

### Step 7 — SSL with Let's Encrypt (free HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d eva.nibjar.com -d www.eva.nibjar.com
```

Follow the prompts. Certbot will automatically update the nginx config and set up auto-renewal.

Visit `https://eva.nibjar.com` — padlock should appear.

---

## Verification Checklist

- [ ] `npm run dev` → `http://localhost:3000` — all 10 sections visible
- [ ] `npm run build && npm start` — no build errors, site loads
- [ ] On droplet: `pm2 status` shows `eva` as `online`
- [ ] On droplet: `curl http://localhost:3011` returns HTML
- [ ] `http://eva.nibjar.com` loads via nginx
- [ ] `https://eva.nibjar.com` loads with valid SSL cert
- [ ] `http://eva.nibjar.com` redirects to `https://eva.nibjar.com` (certbot handles this)

---

## Common Commands (on the droplet)

```bash
pm2 logs eva     # view app logs
pm2 restart eva  # restart after code changes
pm2 status                     # check process status
sudo nginx -t                  # validate nginx config
sudo systemctl reload nginx    # reload nginx without downtime
sudo certbot --nginx -d eva.nibjar.com -d www.eva.nibjar.com
sudo certbot renew --dry-run   # test SSL auto-renewal
```

## Updating the Site

```bash
cd /var/www/eva
git pull                        # or rsync from local
npm install
npm run build
pm2 restart eva
```

rsync -avz --delete --exclude node*modules --exclude .next \
/Users/sanatmool/Documents/website\ *\ Eva\ Nepal/ \
root@139.59.59.91:/var/www/eva/
