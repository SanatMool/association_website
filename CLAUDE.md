# EVA Nepal Website — Claude Code Context

## Project Identity

**Event and Venue Association Nepal (EVA Nepal)**

- Official industry body for event venues in Kathmandu since 2011
- 150+ member venues across Kathmandu Valley
- Head office: Maitidevi, Kathmandu, Nepal

## Tech Stack

| Layer      | Technology                                                 |
| ---------- | ---------------------------------------------------------- |
| Framework  | Next.js 14 (App Router)                                    |
| Language   | TypeScript (strict)                                        |
| Styling    | TailwindCSS 3                                              |
| Animations | Framer Motion 11                                           |
| Icons      | lucide-react                                               |
| Fonts      | next/font/google — Inter (sans) + Playfair Display (serif) |

## Design System

- **Primary color**: Navy `#0a1040` → Tailwind class `navy-900`
- **Accent color**: Gold `#f59e0b` → Tailwind class `gold-500`
- **Typography**: `font-serif` = Playfair Display, `font-sans` = Inter
- **Layout utilities** (in `globals.css`): `.section-padding`, `.container-max`, `.card`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.gold-divider`, `.section-label`
- **Custom shadows**: `shadow-gold`, `shadow-navy`, `shadow-card`, `shadow-card-hover`, `shadow-gold-glow`, `shadow-card-md`, `shadow-card-gold`, `shadow-glass`
- **Glass morphism**: `.card-glass` (bg-white/5 + backdrop-blur), `.card-navy` (navy glass)
- **Gradient text**: `.text-gradient-gold` (gold shimmer gradient text)
- **Mesh backgrounds**: `.bg-mesh-navy`, `.bg-mesh-light` (animated gradient mesh)
- **Texture**: `.texture-noise` (SVG noise overlay), `.scan-line` (film grain)
- **Animations** (`tailwind.config.ts`): `float`, `pulse-gold`, `border-glow`, `bokehFloat`, `scanLine`, `glowPulse`, `gradientShift`, `fadeUpIn`
- **Easing**: `spring`, `bounce-soft`
- **Border radius**: `4xl`, `5xl`
- **Section transitions**: `.section-fade-into-dark`, `.section-fade-into-light`, `.animated-gradient-border`, `.gold-glow-pulse`

## Project Structure

```
app/
  layout.tsx              Root layout — LocaleProvider, Navbar, Footer, JSON-LD schema
  page.tsx                Homepage: Hero → StatsSection → About → Mission → MemberDirectory
                          → WhyJoin → Events → News → Timeline → ExecutiveCommittee
                          → MembershipForm → Contact
  globals.css             Tailwind base + full design-system utilities (NO @import)
  members/
    page.tsx              "use client" — full member directory with search/area/capacity filter + grid/list toggle
    [slug]/page.tsx       Static member profile page (155 pages via generateStaticParams)
  events/page.tsx         "use client" — events list with status/type filters
  news/
    page.tsx              "use client" — news list with category filter
    [slug]/page.tsx       Static article page (6 pages via generateStaticParams)
  sitemap.ts              Auto-generated from members + news data
  robots.ts               Robots.txt
  not-found.tsx           404 page

components/
  layout/
    Navbar.tsx            Fixed scroll-aware navbar; gold top-line on scroll, spring logo,
                          animated underlines (layoutId), flag emoji locale switcher,
                          stagger mobile menu, animated hamburger↔close icon
    Footer.tsx            Top gold accent line, mesh background, icon-box social links,
                          full links + contact columns
  sections/
    Hero.tsx              Cinematic hero: scroll-parallax (useScroll/useTransform), 5 bokeh
                          orbs, film grain, slide progress bar, 01/04 counter, ping badge,
                          shine sweep CTA, text-gradient-gold title, bottom-fade transition
    StatsSection.tsx      Animated count-up stats (150+/14+/20k+/100%), dark navy + mesh bg
    About.tsx             Real Unsplash venue image + spring-animated detail cards
    Mission.tsx           Dark navy mesh bg, glass cards, large bg numbers, bottom accent lines
    MemberDirectory.tsx   Featured venues + search/area/capacity filters + grid/list toggle + CTA
    WhyJoin.tsx           Mesh bg, white numbered-badge benefit cards, dark navy CTA block
    Events.tsx            Calendar-style grouped by month, side panel for past events, type legend
    News.tsx              Editorial: featured hero card + 3-card grid + sidebar list, category colors
    Timeline.tsx          Dark navy, glass morphism cards, gold spine + animated progress,
                          watermark year, glow dots, glass summary block
    ExecutiveCommittee.tsx Leadership grid + styled divider + committee members grid
    MembershipForm.tsx    White card shadow, mesh bg, 7-field form, simulated success state
    Contact.tsx           Dark navy mesh bg, glass cards with icon boxes, 3-panel layout
  ui/
    AnimatedSection.tsx   Scroll-triggered fade/slide wrapper (framer-motion useInView)
    MemberCard.tsx        176px gradient image area (capacity-tier: gold/blue/emerald/purple),
                          pulsing building icon, SVG pattern overlay, hover glow border,
                          capacity overlay in image, thin capacity bar at bottom, category badge
    EventCard.tsx         Pattern overlay image area, per-type color bar, date badge in image
    NewsCard.tsx          Per-category colored bar, motion hover lift
    CommitteeCard.tsx     Deterministic-color gradient initials avatar, animated star pulse
                          on highlighted (president/VP)

data/
  members.ts              155 members (6 detailed + 149 generated). Exports: members[], getAreaList(), getMemberBySlug()
  events.ts               10 events (5 upcoming, 5 past). Types: networking|training|meeting|exhibition|conference
  news.ts                 6 news items. Categories: announcement|training|event|industry|member
  committee.ts            9 committee members

context/
  LocaleContext.tsx       React context for EN/NE locale. Hook: useLocale() → { locale, setLocale, t }

lib/
  i18n.ts                 Full EN + NE translation objects for all sections
  utils.ts                cn(), slugify(), formatDate(), formatMonthYear(), formatDay(), formatMonthShort()

Root config files:
  next.config.mjs         Next.js config (must be .mjs, not .ts)
  tailwind.config.ts      Extended palette (navy/gold), expanded shadows, animations, easing, radii
  tsconfig.json           target: es2017, downlevelIteration: true (Set spread support)
  ecosystem.config.js     PM2 config — runs Next.js on port 3011
  nginx.conf              Nginx reverse proxy: 80 → 3011 (HTTPS block commented until SSL setup)
  deploy.sh               One-command deploy: git pull → npm ci → build → pm2 restart
  .env.example            Template for environment variables
```

## Critical Rules / Gotchas

### 1. NO `@import` in globals.css

Fonts are loaded via `next/font/google` in `app/layout.tsx`. Never add `@import url(...)` to globals.css — Tailwind directives must be at the top and CSS @import must precede all other rules.

### 2. Locale-safe date formatting

Never use `new Date().toLocaleString()` or `toLocaleDateString()` — causes SSR/CSR hydration mismatches. Always use the utils helpers:

```ts
import {
	formatDate,
	formatDay,
	formatMonthShort,
	formatMonthYear,
} from "@/lib/utils";
formatDate("2025-03-10"); // "March 10, 2025"
formatMonthShort("2025-03-10"); // "Mar"
formatDay("2025-03-10"); // 10
formatMonthYear("2025-03-10"); // "March 2025"
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

| Route             | Type               | Description             |
| ----------------- | ------------------ | ----------------------- |
| `/`               | Static             | Homepage (all sections) |
| `/members`        | Client             | Full member directory   |
| `/members/[slug]` | Static (155 pages) | Venue profiles          |
| `/events`         | Client             | Events list             |
| `/news`           | Client             | News list               |
| `/news/[slug]`    | Static (6 pages)   | Article detail          |
| `/sitemap.xml`    | Auto               | Generated sitemap       |
| `/robots.txt`     | Auto               | Search directives       |

## SEO Keywords Targeted

- event venues in Kathmandu
- wedding venues Kathmandu
- party venues Kathmandu
- banquet halls Kathmandu
- venue association Nepal
- event management Nepal

## Completed (do not re-implement)

- [x] Full Next.js 14 App Router project scaffold with TypeScript + Tailwind
- [x] EN/NE bilingual i18n system via React Context
- [x] 155-member data layer with slug routing (6 detailed + 149 generated)
- [x] All homepage sections: Hero, StatsSection, About, Mission, MemberDirectory, WhyJoin, Events, News, Timeline, ExecutiveCommittee, MembershipForm, Contact
- [x] Full member directory page with search + area + capacity filter + grid/list view
- [x] Events page with status/type filters
- [x] News page with category filter + individual article pages
- [x] V1 base design system (navy/gold, fonts, layout utilities)
- [x] V2 visual overhaul (slideshow hero, editorial news, calendar events, MemberCard capacity bar)
- [x] V3 glass morphism, mesh backgrounds, gradient text, animation tokens
- [x] V4 wow-factor redesign: cinematic Hero parallax, StatsSection count-up, new MemberCard image tiles, Timeline glass morphism, bokeh orbs, film grain
- [x] PM2 + Nginx deployment config + deploy.sh script

## TODO / Pending

- [ ] Add real EVA Nepal contact: phone, email, Facebook URL, Instagram URL
- [ ] Replace `metadataBase` URL in `layout.tsx` with actual domain
- [ ] Add `/public/favicon.ico` and `/public/og-image.jpg` (1200×630px)
- [ ] Wire membership form to backend (Resend/Nodemailer or a form service)
- [ ] Add real venue photos to member profile pages (member profile `[slug]/page.tsx`)
- [ ] Replace committee member initials avatars with real photos
- [ ] Update `nginx.conf` `server_name` with actual domain
- [ ] Set up SSL via Certbot (after DNS is pointing)

## Current Work

You are working inside an existing Next.js 14 project.

IMPORTANT:
Do NOT redesign the website or rebuild UI components.

The public website is already complete.
Your task is ONLY to add a CMS system to manage its content.

The project currently uses static data files:

/data/members.ts
/data/events.ts
/data/news.ts
/data/committee.ts

These must now be replaced with a database-backed CMS.

Use the following stack:

Next.js 14 (App Router)
TypeScript
Prisma ORM
PostgreSQL
NextAuth for authentication
TailwindCSS (already installed)

---

DATABASE

Use the existing models defined in database.md:

Member
Event
News
CommitteeMember
AdminUser

Create a Prisma schema based on these models.

---

GOAL

Add a CMS so administrators can manage the website content through an admin dashboard.

Admins must be able to:

• add/edit/delete members
• add/edit/delete news articles
• add/edit/delete events
• add/edit/delete committee members

---

ADMIN PANEL

Create an admin dashboard inside:

/app/(admin)/admin

Routes:

/admin/login
/admin/dashboard
/admin/members
/admin/events
/admin/news
/admin/committee

Use a sidebar layout with simple tables and forms.

Do not overdesign the UI.

---

AUTHENTICATION

Use NextAuth.

Only authenticated admin users can access:

/admin/\*

Public pages remain accessible to everyone.

---

API ROUTES

Create API routes for CRUD operations.

Example:

/api/members
/api/members/[id]

/api/events
/api/events/[id]

/api/news
/api/news/[id]

/api/committee
/api/committee/[id]

Use Prisma for database queries.

---

PUBLIC WEBSITE INTEGRATION

Replace static imports like:

import { members } from "@/data/members"

with database queries.

Example:

const members = await prisma.member.findMany()

Keep existing components such as:

MemberCard
EventCard
NewsCard
CommitteeCard

Do not modify their design.

---

DATA MIGRATION

Create a seed script that imports existing data from:

/data/members.ts
/data/events.ts
/data/news.ts
/data/committee.ts

into the database.

---

IMAGE HANDLING

Allow image uploads for members, events, news, and committee.

Store images in:

/public/uploads

Save image paths in database.

---

OUTPUT

Provide:

1. Prisma schema
2. database connection setup
3. NextAuth setup
4. API route examples
5. admin dashboard layout
6. seed script
7. example CRUD form
