# EVA Nepal Website — Claude Code Context

## Project Identity
**Event and Venue Association Nepal (EVA Nepal)**
- Official industry body for event venues in Kathmandu since 2011
- 150+ member venues across Kathmandu Valley
- Head office: Maitidevi, Kathmandu, Nepal

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | TailwindCSS 3 |
| Animations | Framer Motion 11 |
| Icons | lucide-react |
| Fonts | next/font/google — Inter (sans) + Playfair Display (serif) |

## Design System
- **Primary color**: Navy `#0a1040` → Tailwind class `navy-900`
- **Accent color**: Gold `#f59e0b` → Tailwind class `gold-500`
- **Typography**: `font-serif` = Playfair Display, `font-sans` = Inter
- **Layout utilities** (in `globals.css`): `.section-padding`, `.container-max`, `.card`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.gold-divider`, `.section-label`
- **Custom shadows**: `shadow-gold`, `shadow-navy`, `shadow-card`, `shadow-card-hover`

## Project Structure
```
app/
  layout.tsx              Root layout — LocaleProvider, Navbar, Footer, JSON-LD schema
  page.tsx                Homepage (all section components composed here)
  globals.css             Tailwind base + custom utilities (NO @import — use next/font)
  members/
    page.tsx              "use client" — full member directory with search/filter/view toggle
    [slug]/page.tsx       Static member profile page
  events/page.tsx         "use client" — events list with filter
  news/
    page.tsx              "use client" — news list with category filter
    [slug]/page.tsx       Static article page
  sitemap.ts              Auto-generated from members + news data
  robots.ts               Robots.txt
  not-found.tsx           404 page

components/
  layout/
    Navbar.tsx            Fixed scroll-aware navbar, language switcher, mobile menu
    Footer.tsx            Full footer with links, contact, social icons
  sections/
    Hero.tsx              Slideshow hero (4 Unsplash images), floating thumbnails, stats bar
    About.tsx             Association overview + info cards
    Mission.tsx           6 mission pillars grid
    MemberDirectory.tsx   Featured venues + search/filter/view toggle + CTA
    WhyJoin.tsx           6 benefit cards on navy bg
    Events.tsx            Calendar-style: month groups for upcoming, sidebar for past
    News.tsx              Editorial layout: featured card + 3-card grid + sidebar list
    Timeline.tsx          9 milestones 2011-2025, alternating layout, animated spine
    ExecutiveCommittee.tsx Leadership grid + committee members
    MembershipForm.tsx    7-field form with simulated submission + success state
    Contact.tsx           3-panel contact info on navy bg
  ui/
    AnimatedSection.tsx   Scroll-triggered fade/slide wrapper (framer-motion useInView)
    MemberCard.tsx        Venue card: capacity bar, shine hover, gold glow, category badge
    EventCard.tsx         Event card with status/type styling
    NewsCard.tsx          News card with category color system
    CommitteeCard.tsx     Profile card, gold highlighted for president/VP

data/
  members.ts              155 members (first 20 detailed + 135 generated). Exports: members[], getAreaList(), getMemberBySlug()
  events.ts               10 events (5 upcoming, 5 past). Types: networking|training|meeting|exhibition|conference
  news.ts                 6 news items. Categories: announcement|training|event|industry|member
  committee.ts            9 committee members

context/
  LocaleContext.tsx       React context for EN/NE locale. Hook: useLocale() → { locale, setLocale, t }

lib/
  i18n.ts                 Full EN + NE translation objects for all sections
  utils.ts                cn(), slugify(), formatDate(), formatMonthYear(), formatDay(), formatMonthShort()
```

## Critical Rules / Gotchas

### 1. NO `@import` in globals.css
Fonts are loaded via `next/font/google` in `app/layout.tsx`. Never add `@import url(...)` to globals.css — Tailwind directives must be at the top and CSS @import must precede all other rules.

### 2. Locale-safe date formatting
Never use `new Date().toLocaleString()` or `toLocaleDateString()` — causes SSR/CSR hydration mismatches. Always use the utils helpers:
```ts
import { formatDate, formatDay, formatMonthShort, formatMonthYear } from "@/lib/utils";
formatDate("2025-03-10")       // "March 10, 2025"
formatMonthShort("2025-03-10") // "Mar"
formatDay("2025-03-10")        // 10
formatMonthYear("2025-03-10")  // "March 2025"
```

### 3. i18n type is `any`
The `t` object from `useLocale()` is typed as `any` to avoid TypeScript literal string conflicts between EN and NE translations. When using `.map()` on arrays inside `t`, annotate callback params explicitly:
```tsx
t.mission.items.map((item: { title: string; desc: string }, i: number) => ...)
```

### 4. Inline dynamic import types are banned
Do not use `import("@/data/members").Member` as an inline type in function params. Always import the type at the top:
```ts
import { type Member } from "@/data/members";
```

### 5. "use client" boundary
All components using React hooks (useState, useEffect, useRef, useInView, useLocale, usePathname) need `"use client"` at line 1. Pages that use hooks must also be client components.

### 6. next.config must be `.mjs`
Next.js 14 does not support `next.config.ts`. Use `next.config.mjs` only.

### 7. tsconfig target
Set `"target": "es2017"` and `"downlevelIteration": true` (with `"ignoreDeprecations": "5.0"`) to support `Set` spread syntax in member filtering.

## Deployment

### Port
Next.js runs on **port 3011** via PM2. Nginx proxies public traffic (80/443) → 3011.

### PM2
```bash
pm2 start ecosystem.config.js   # first time
pm2 restart eva-nepal            # after rebuild
pm2 logs eva-nepal               # view logs
pm2 status                       # check running
pm2 save && pm2 startup          # persist across reboots
```

### Nginx
Config file: `nginx.conf` in project root.
```bash
sudo cp nginx.conf /etc/nginx/sites-available/evanepal.org
sudo ln -s /etc/nginx/sites-available/evanepal.org /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Full Deploy Flow
```bash
git pull origin main
npm ci
npm run build
pm2 restart eva-nepal
```
Or just: `bash deploy.sh`

### SSL (after DNS is pointing)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d evanepal.org -d www.evanepal.org
```
Then uncomment the HTTPS server block in `nginx.conf`.

### Server Requirements
- Ubuntu 20.04+ / Debian 11+
- Node.js 18 LTS
- PM2 (`npm install -g pm2`)
- Nginx (`sudo apt install nginx`)
- Minimum: 1 vCPU, 1GB RAM

### File locations on server
```
/var/www/eva-nepal/         → app root (clone here)
/etc/nginx/sites-available/ → nginx config
/var/log/pm2/               → PM2 log files
/var/log/nginx/             → Nginx access/error logs
```

## Pages & URLs
| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Homepage (all sections) |
| `/members` | Client | Full member directory |
| `/members/[slug]` | Static (155 pages) | Venue profiles |
| `/events` | Client | Events list |
| `/news` | Client | News list |
| `/news/[slug]` | Static (6 pages) | Article detail |
| `/sitemap.xml` | Auto | Generated sitemap |
| `/robots.txt` | Auto | Search directives |

## SEO Keywords Targeted
- event venues in Kathmandu
- wedding venues Kathmandu
- party venues Kathmandu
- banquet halls Kathmandu
- venue association Nepal
- event management Nepal

## TODO / Pending
- [ ] Add real EVA Nepal contact: phone, email, Facebook URL, Instagram URL
- [ ] Replace `metadataBase` URL in `layout.tsx` with actual domain
- [ ] Add `/public/favicon.ico` and `/public/og-image.jpg` (1200×630px)
- [ ] Wire membership form to backend (Resend/Nodemailer or a form service)
- [ ] Add real venue photos to member profile pages
- [ ] Update `nginx.conf` `server_name` with actual domain
- [ ] Set up SSL via Certbot
