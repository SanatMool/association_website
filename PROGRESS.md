---                                                                                                                                                                                          
  Add this at the very TOP of your progress.md
                                                                                                                                                                                               
  ## HOW TO USE THIS FILE                                                                                                                                                                    
                                                                                                                                                                                               
  Read this before every session. Update it after every task.
  This is the source of truth for what is done and what is next.
  Do NOT start any task without reading this first.
  Do NOT finish any task without updating this file.

  ---

# EVA Nepal Website — Build Progress

## What Is This Project

Full public-facing website for the **Event and Venue Association Nepal (EVA Nepal)**, an official industry body for event venues in Kathmandu, founded 2011. The site serves as the primary digital presence: member directory, events calendar, news, association history, and membership applications.

---

## Tech Stack

| Layer            | Choice                  | Reason                                                   |
| ---------------- | ----------------------- | -------------------------------------------------------- |
| Framework        | Next.js 14 (App Router) | Static + client hybrid, great SEO                        |
| Language         | TypeScript (strict)     | Type safety throughout                                   |
| Styling          | TailwindCSS 3           | Utility-first, custom design tokens                      |
| Animations       | Framer Motion 11        | Scroll effects, layout animations                        |
| Icons            | lucide-react            | Consistent icon set                                      |
| Fonts            | next/font/google        | Inter (sans) + Playfair Display (serif), no layout shift |
| ORM              | Prisma v7               | Type-safe DB queries                                     |
| Database         | PostgreSQL              | Relational, hosted locally                               |
| Auth             | NextAuth v4 (JWT)       | Admin authentication                                     |
| Password hashing | bcryptjs                | Secure credential storage                                |

---

## File System

```
project-root/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage — fetches all data from DB, passes as props
│   ├── globals.css               # Tailwind + full design-system utilities
│   ├── not-found.tsx             # 404 page
│   ├── sitemap.ts                # Auto-generated sitemap (queries DB for slugs)
│   ├── robots.ts                 # robots.txt
│   ├── members/
│   │   ├── page.tsx              # Server component — fetches members from DB
│   │   ├── MembersClient.tsx     # "use client" — search/area/capacity filter + grid/list toggle
│   │   └── [slug]/page.tsx       # ISR member profile (revalidate=3600)
│   ├── events/
│   │   ├── page.tsx              # Server component — fetches events from DB
│   │   └── EventsClient.tsx      # "use client" — status/type filter
│   ├── news/
│   │   ├── page.tsx              # Server component — fetches news from DB
│   │   ├── NewsClient.tsx        # "use client" — category filter
│   │   └── [slug]/page.tsx       # ISR article page (revalidate=3600)
│   ├── (admin)/                  # Admin panel (route group — no URL segment)
│   │   ├── layout.tsx            # Wraps in SessionProvider
│   │   ├── providers.tsx         # "use client" SessionProvider wrapper
│   │   └── admin/
│   │       ├── layout.tsx        # Sidebar layout with nav links + sign-out
│   │       ├── login/page.tsx    # Login form (email + password)
│   │       ├── dashboard/page.tsx # Stats overview (counts per entity)
│   │       ├── members/
│   │       │   ├── page.tsx      # Table of all members + delete
│   │       │   ├── new/page.tsx  # Create member form
│   │       │   └── [id]/page.tsx # Edit member form
│   │       ├── events/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── news/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/page.tsx
│   │       └── committee/
│   │           ├── page.tsx
│   │           ├── new/page.tsx
│   │           └── [id]/page.tsx
│   └── api/                      # REST API routes
│       ├── auth/[...nextauth]/route.ts
│       ├── members/route.ts      # GET list, POST create
│       ├── members/[id]/route.ts # GET, PUT, DELETE
│       ├── events/route.ts
│       ├── events/[id]/route.ts
│       ├── news/route.ts
│       ├── news/[id]/route.ts
│       ├── committee/route.ts
│       ├── committee/[id]/route.ts
│       └── upload/route.ts       # Image upload → /public/uploads/
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx            # Site-wide navigation
│   │   └── Footer.tsx            # Site-wide footer
│   ├── sections/                 # Homepage section components (now accept data as props)
│   │   ├── Hero.tsx
│   │   ├── StatsSection.tsx
│   │   ├── About.tsx
│   │   ├── Mission.tsx
│   │   ├── MemberDirectory.tsx   # Accepts members: MemberType[] prop
│   │   ├── WhyJoin.tsx
│   │   ├── Events.tsx            # Accepts events: EventType[] prop
│   │   ├── News.tsx              # Accepts news: NewsType[] prop
│   │   ├── Timeline.tsx
│   │   ├── ExecutiveCommittee.tsx # Accepts committee: CommitteeType[] prop
│   │   ├── MembershipForm.tsx
│   │   └── Contact.tsx
│   ├── ui/                       # Reusable card components (use lib/types.ts interfaces)
│   │   ├── AnimatedSection.tsx
│   │   ├── MemberCard.tsx        # Uses MemberType
│   │   ├── EventCard.tsx         # Uses EventType
│   │   ├── NewsCard.tsx          # Uses NewsType
│   │   └── CommitteeCard.tsx     # Uses CommitteeType
│   └── admin/                    # Admin-only UI components
│       ├── MemberForm.tsx        # Create/edit member form
│       ├── EventForm.tsx         # Create/edit event form
│       ├── NewsForm.tsx          # Create/edit news form
│       ├── CommitteeForm.tsx     # Create/edit committee member form
│       ├── DeleteButton.tsx      # Inline confirm-delete button
│       └── ImageUpload.tsx       # Upload file or paste URL
│
├── data/                         # Static data (kept as seed source — no longer used by app)
│   ├── members.ts                # 155 venue records (source for seed.ts)
│   ├── events.ts                 # 10 events
│   ├── news.ts                   # 6 articles
│   └── committee.ts              # 9 committee members
│
├── prisma/
│   ├── schema.prisma             # 5 models: Member, Event, News, CommitteeMember, AdminUser
│   ├── seed.ts                   # Seeds DB from /data/*.ts files
│   └── migrations/               # Auto-generated migration files
│       └── 20260311062057_init/
│
├── context/
│   └── LocaleContext.tsx         # EN/NE locale context + useLocale() hook
│
├── lib/
│   ├── i18n.ts                   # Full EN + NE translation strings
│   ├── utils.ts                  # cn(), slugify(), formatDate() family
│   ├── prisma.ts                 # Singleton PrismaClient (Prisma v7 + @prisma/adapter-pg)
│   ├── auth.ts                   # NextAuth options (Credentials + optional Google)
│   └── types.ts                  # Shared serializable interfaces: MemberType, EventType, NewsType, CommitteeType
│
├── prisma.config.ts              # Prisma v7 config — datasource URL + seed command
├── tsconfig.seed.json            # Special tsconfig for ts-node seed runner
├── middleware.ts                 # Protects /admin/* routes via NextAuth
├── next.config.mjs               # Next.js config
├── tailwind.config.ts            # Extended design tokens
├── tsconfig.json                 # TS config (es2017, downlevelIteration)
├── ecosystem.config.js           # PM2 process config
├── nginx.conf                    # Nginx reverse proxy config
├── deploy.sh                     # One-command deploy script
├── .env.local                    # Real env vars (not committed)
└── .env.example                  # Environment variable template
```

---

## Pages & Routes

| Route                     | Render Type            | Description                                                        |
| ------------------------- | ---------------------- | ------------------------------------------------------------------ |
| `/`                       | SSR (Server Component) | Full homepage — fetches members/events/news/committee from DB      |
| `/members`                | SSR + Client           | Server fetches all members → passes to MembersClient for filtering |
| `/members/[slug]`         | ISR (revalidate=3600)  | Venue profile page — queried from DB on-demand, cached 1hr         |
| `/events`                 | SSR + Client           | Server fetches events → EventsClient for filter state              |
| `/news`                   | SSR + Client           | Server fetches news → NewsClient for category filter               |
| `/news/[slug]`            | ISR (revalidate=3600)  | Article page — queried from DB, cached 1hr                         |
| `/sitemap.xml`            | ISR (revalidate=3600)  | Generated from member + news slugs in DB                           |
| `/robots.txt`             | Static                 | Search engine directives                                           |
| `/admin/login`            | Static                 | Admin login page                                                   |
| `/admin/dashboard`        | SSR                    | Stat cards (entity counts from DB)                                 |
| `/admin/members`          | SSR                    | Table of all members with Edit/Delete                              |
| `/admin/members/new`      | Static                 | Create member form                                                 |
| `/admin/members/[id]`     | SSR                    | Edit member form (pre-filled from DB)                              |
| `/admin/events`           | SSR                    | Table of all events                                                |
| `/admin/events/new`       | Static                 | Create event form                                                  |
| `/admin/events/[id]`      | SSR                    | Edit event form                                                    |
| `/admin/news`             | SSR                    | Table of all news articles                                         |
| `/admin/news/new`         | Static                 | Create article form                                                |
| `/admin/news/[id]`        | SSR                    | Edit article form                                                  |
| `/admin/committee`        | SSR                    | Table of committee members                                         |
| `/admin/committee/new`    | Static                 | Add committee member form                                          |
| `/admin/committee/[id]`   | SSR                    | Edit committee member form                                         |
| `/api/members`            | API                    | GET list / POST create                                             |
| `/api/members/[id]`       | API                    | GET / PUT / DELETE                                                 |
| `/api/events`             | API                    | GET / POST                                                         |
| `/api/events/[id]`        | API                    | GET / PUT / DELETE                                                 |
| `/api/news`               | API                    | GET / POST                                                         |
| `/api/news/[id]`          | API                    | GET / PUT / DELETE                                                 |
| `/api/committee`          | API                    | GET / POST                                                         |
| `/api/committee/[id]`     | API                    | GET / PUT / DELETE                                                 |
| `/api/upload`             | API                    | POST — multipart image upload                                      |
| `/api/auth/[...nextauth]` | API                    | NextAuth handler                                                   |

---

## Components — What Each Does

### Layout

**`Navbar.tsx`**

- Fixed to top, changes style on scroll (gold top-line appears)
- Logo with spring hover animation
- Nav links with animated underline (Framer Motion `layoutId="nav-underline"`)
- Language switcher: flag emoji (EN 🇬🇧 / NE 🇳🇵) toggles locale via `LocaleContext`
- Mobile: animated hamburger ↔ close icon, stagger-animated menu items

**`Footer.tsx`**

- Gold accent line at top
- Navy mesh gradient background
- Three columns: brand/description, quick links, contact info
- Social links as icon-boxes (Facebook, Instagram, YouTube, Twitter)
- Copyright row

---

### Homepage Sections (order in page.tsx)

**`Hero.tsx`** — Cinematic full-screen hero

- 5 slides cycling through Kathmandu venue imagery (Unsplash)
- Scroll-parallax: background and text move at different rates (`useScroll`, `useTransform`)
- 5 animated bokeh orbs floating in background
- Film grain overlay via `.scan-line` CSS class
- Decorative horizontal lines on left edge
- Slide progress bar (animated fill) + `01/04` slide counter
- Ping-pulse badge ("150+ Venues")
- CTA button with shine-sweep hover animation
- Title uses `.text-gradient-gold`
- Bottom fade transition into next section

**`StatsSection.tsx`** — Animated statistics

- 4 stats: 150+ Members, 14+ Years, 20k+ Events, 100% Dedicated
- Count-up animation triggered by scroll into view
- Dark navy background with animated mesh gradient
- Placed directly after Hero on homepage

**`About.tsx`** — Association overview

- Left: real Unsplash venue interior photo (aspect-video, rounded)
- Right: headline + description + 3 detail cards (Year founded, Members, Coverage)
- Cards spring-animate in on scroll

**`Mission.tsx`** — 6 mission pillars

- Dark navy background with mesh gradient
- 3×2 grid of glass-morphism cards
- Each card: large decorative background number, icon, title, description, gold bottom accent line

**`MemberDirectory.tsx`** — Featured member showcase

- Accepts `members: MemberType[]` prop (was: static import)
- Search input + area dropdown + capacity dropdown filter panel
- Grid/list view toggle (animated)
- Shows first 6 filtered members as `MemberCard` components
- "View All Members" CTA → `/members`

**`WhyJoin.tsx`** — Membership benefits

- Light mesh background
- 6 white benefit cards, each with numbered navy badge, icon, title, description
- Bottom CTA block on dark navy background

**`Events.tsx`** — Events calendar

- Accepts `events: EventType[]` prop (was: static import)
- Upcoming events grouped by month (calendar-style vertical layout)
- Past events in a sidebar panel
- Event type legend (networking / training / meeting / exhibition / conference)
- Uses `formatMonthYear()` for locale-safe month headings

**`News.tsx`** — Editorial news layout

- Accepts `news: NewsType[]` prop (was: static import)
- Featured hero card (full-width, large image area)
- 3-card grid of recent articles
- Sidebar list of remaining articles
- Category color system: announcement (blue) / training (green) / event (purple) / industry (orange) / member (gold)

**`Timeline.tsx`** — Association history 2011–2025

- 9 milestones in alternating left/right layout
- Dark navy background, glass morphism cards (`bg-white/5 backdrop-blur`)
- Animated gold spine (progress fills as you scroll)
- Large decorative watermark year ("2011") at top
- Highlighted milestone has glowing dot
- Glass summary block at bottom

**`ExecutiveCommittee.tsx`** — Leadership section

- Accepts `committee: CommitteeType[]` prop (was: static import)
- President + Vice President in prominent cards
- Styled gold divider between leadership and committee
- 7 committee members in a responsive grid

**`MembershipForm.tsx`** — Application form

- White card on mesh background
- 7 fields: Name, Organization, Position, Area, Venue Type, Phone, Email
- Animated step indicators on hover
- Simulated submit with loading state → success message (no backend yet)

**`Contact.tsx`** — Contact information

- Dark navy mesh background
- 3 glass cards: Address (with map pin), Phone, Email
- Each card has icon box + label + value

---

### UI Components

**`AnimatedSection.tsx`**

- Wraps any content with a scroll-triggered fade + slide-up animation
- Uses Framer Motion `useInView` with configurable threshold and delay
- Used by almost every section

**`MemberCard.tsx`** — Uses `MemberType` from `lib/types.ts`

- 176px gradient image area — color tier based on capacity:
    - Gold (500+), Blue (200–499), Emerald (100–199), Purple (<100)
- Animated pulsing building icon in image area
- SVG pattern overlay on image
- Capacity number displayed in image
- Hover: gold glow border, slight lift
- Bottom: thin colored capacity bar, venue name, area, category badge

**`EventCard.tsx`** — Uses `EventType` from `lib/types.ts`

- Image area with decorative pattern overlay
- Color bar per event type (left edge)
- Date badge overlaid on image
- Status chip (Upcoming / Past)

**`NewsCard.tsx`** — Uses `NewsType` from `lib/types.ts`

- Colored top bar per category
- Hover: lifts with motion
- Shows: category badge, date, title, excerpt, read-more link

**`CommitteeCard.tsx`** — Uses `CommitteeType` from `lib/types.ts`

- Gradient initials avatar — color is deterministic by name (always same person = same color)
- President/VP: animated gold star pulse, highlighted border
- Shows name, role, organization

---

### Admin Components

**`MemberForm.tsx`** — Full form for creating/editing members:

- Fields: name, slug, area, capacity, type/category, phone, email, website, description, amenities, memberSince, established, featured, image
- Image upload via `ImageUpload` component
- Submits to `POST /api/members` or `PUT /api/members/[id]`

**`EventForm.tsx`** — Create/edit events:

- Fields: title, titleNe, slug, date, endDate, location, type, status, description, attendees, image

**`NewsForm.tsx`** — Create/edit news articles:

- Fields: title, titleNe, slug, author, category, excerpt, content, publishedAt, featured, image

**`CommitteeForm.tsx`** — Create/edit committee members:

- Fields: name, role, roleKey, organization, venue, bio, order, highlighted, image

**`DeleteButton.tsx`** — Inline delete with browser confirm dialog

**`ImageUpload.tsx`** — Upload file to `/api/upload` or paste a URL

---

## Data Layer

### Before CMS (static files — kept as seed source only)

**`data/members.ts`**

- 155 venue records total; 6 detailed + 149 generated
- No longer imported by app pages — only used by `prisma/seed.ts`

**`data/events.ts`**, **`data/news.ts`**, **`data/committee.ts`**

- Same — kept as seed source only

### After CMS (database via Prisma)

- All data fetched server-side via `import { prisma } from "@/lib/prisma"`
- Dates always converted to ISO strings before passing to client components
- `lib/types.ts` provides serializable interfaces used by all components

---

## i18n System

- `lib/i18n.ts` — full translation objects for both `en` and `ne` (Nepali)
- Covers: nav, hero, about, mission, memberDirectory, whyJoin, events, news, timeline, committee, membership, contact, footer
- `context/LocaleContext.tsx` — React context, persists choice to localStorage
- `useLocale()` returns `{ locale, setLocale, t }` where `t` is typed `any`
- Language switcher in Navbar triggers re-render of all translated text

---

## Design System Evolution

### V1 — Base

- Navy (#0a1040) + Gold (#f59e0b) palette in `tailwind.config.ts`
- Basic layout utilities: `.section-padding`, `.container-max`, `.card`, `.btn-primary/secondary/outline`, `.gold-divider`, `.section-label`
- Shadows: `shadow-gold`, `shadow-navy`, `shadow-card`, `shadow-card-hover`

### V2 — Visual Upgrade

- Hero: full-screen image slideshow, floating venue thumbnails, stats bar
- MemberCard: capacity bar with color tier, shimmer hover sweep, gold glow
- MemberDirectory: search + area + capacity filters, grid/list view toggle
- Events: calendar-style month groupings, past events sidebar, type legend
- News: editorial layout (featured hero + card grid + sidebar list)
- Timeline: alternating milestone layout, animated spine

### V3 — Glass & Atmosphere

- Glass morphism: `.card-glass` (bg-white/5 + backdrop-blur), `.card-navy`
- Gradient text: `.text-gradient-gold`
- Mesh backgrounds: `.bg-mesh-navy`, `.bg-mesh-light` (animated CSS gradients)
- Noise texture: `.texture-noise`, angled dividers via `clip-path`
- New shadows: `gold-glow`, `card-md`, `card-gold`, `glass`
- New animations: `float`, `pulse-gold`, `border-glow`
- New easing: `spring`, `bounce-soft`
- New radii: `4xl`, `5xl`
- Navbar: gold scroll line, spring logo, layoutId underlines, flag locale switcher
- Component overhauls: About, Mission, WhyJoin, CommitteeCard, EventCard, NewsCard, ExecutiveCommittee, Contact, Footer, MembershipForm

### V4 — Wow Factor

- Hero: full cinematic rewrite with useScroll parallax, 5 bokeh orbs, film grain, progress bar, shine sweep
- StatsSection: new component with count-up numbers, placed after Hero
- MemberCard: full image tile redesign (176px gradient, tier colors, pulsing icon, SVG pattern)
- Timeline: dark navy + glass morphism cards, animated spine, watermark year
- globals.css additions: `bokehFloat`, `scanLine`, `glowPulse`, `gradientShift`, `fadeUpIn` keyframes; `.animated-gradient-border`, `.gold-glow-pulse`, `.scan-line`, `.section-fade-into-dark/light`

### V5 — CMS Backend

- Added Prisma v7 + PostgreSQL as data layer
- All static imports removed from pages and section components
- Admin panel added at `/admin/*` (protected by NextAuth middleware)
- API routes for full CRUD on all 4 entities + image upload
- ISR replacing `generateStaticParams` on dynamic pages
- `lib/types.ts` added as shared serializable type bridge

---

## Deployment Architecture

```
Internet → Nginx (80/443) → Next.js on port 3002 (managed by PM2)
                                      ↓
                              PostgreSQL on localhost:5432
```

- **`ecosystem.config.js`** — PM2 config: `name: "eva-nepal"`, port 3002
- **`nginx.conf`** — Reverse proxy; HTTP block active, HTTPS block commented (enable after Certbot)
- **`deploy.sh`** — `git pull → npm ci → npm run build → pm2 restart eva-nepal`
- Server target: Ubuntu 20.04+, Node 18 LTS, PM2, Nginx, PostgreSQL 14+, 1 vCPU / 1GB RAM minimum

### Server Setup (first time on VPS)

```bash
# Install PostgreSQL
sudo apt install postgresql

# Create DB and user
sudo -u postgres psql
CREATE USER evanepal_user WITH PASSWORD 'strongpassword';
CREATE DATABASE evanepal OWNER evanepal_user;
\q

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://evanepal_user:strongpassword@localhost:5432/evanepal"

# Run migrations and seed
npx prisma migrate deploy
npx prisma db seed
```

---

## Known Pending Items

| Item                                        | File to edit                                                      |
| ------------------------------------------- | ----------------------------------------------------------------- |
| Real phone/email/social URLs for EVA Nepal  | `components/layout/Footer.tsx`, `components/sections/Contact.tsx` |
| Replace metadataBase URL                    | `app/layout.tsx`                                                  |
| Add favicon.ico + og-image.jpg (1200×630px) | `/public/` directory                                              |
| Wire membership form to real backend        | `components/sections/MembershipForm.tsx`                          |
| Real venue photos for member profiles       | Admin panel → Members → upload image per member                   |
| Real photos for committee members           | Admin panel → Committee → upload image per member                 |
| Update nginx.conf server_name               | `nginx.conf`                                                      |
| Set up SSL via Certbot                      | Server-side after DNS points                                      |
| Change admin password                       | `/admin/login` → log in → update via DB or new admin endpoint     |
| Set NEXTAUTH_SECRET in production           | `.env.local` on server                                            |

---

## Build Status

```
✓ npm run build — passes cleanly
✓ Multi-tenancy: Step 1–6 complete
✓ DB seeded: 2 associations, 196 members (155 EVA + 41 Bhaktapur), 10 events, 6 news, 9 committee, 9 timeline entries
✓ All admin routes scoped by associationId from session
✓ Platform panel live at /platform/* (assoc-platform.nibjar.com)
✓ Admin member visibility toggle — VisibilityToggle.tsx, /api/members/[id]/visibility/route.ts
✓ MembershipApplication — model + migration + POST/GET/PATCH/DELETE API + /admin/applications admin page
✓ Platform create association — /platform/associations/new + /api/platform/associations POST
✓ Platform edit association — /platform/associations/[id]/edit + /api/platform/associations/[id] PUT
✓ Dynamic multi-tenant content — all hardcoded "EVA" text replaced with association name/shortName props
✓ SiteSettings: favicon_image, default_member_image keys; Bhaktapur data seeded
✓ MemberCard: defaultImage prop for per-association fallback image
```

## Multi-Tenancy Implementation

### Step 1 — Schema ✓
- Association, MemberAssociation, TimelineEntry, PlatformUser, ApiLog models added
- All content models (Event, News, CommitteeMember, AdminUser, SiteSettings, AdminTask) have associationId
- Members linked via MemberAssociation join table (many-to-many, per-association visible flag)
- Migration deployed: 20260609000000_add_multi_tenancy_association_platform

### Step 2 — Middleware + Auth ✓
- middleware.ts: domain-based routing, platform subdomain, admin auth protection
- lib/auth.ts: associationId + associationSlug in JWT/session
- lib/getAssociation.ts: React.cache() server-side association resolver

### Step 3 — Public pages scoped ✓
- app/page.tsx, /members, /events, /news, /members/[slug], /news/[slug] — all filter by associationId
- Timeline component accepts entries from DB, hides if empty
- Sitemap scoped per association domain
- lib/settings.ts accepts associationId param

### Step 4 — Admin panel scoped ✓
- lib/adminAuth.ts: getAdminContext() helper used in all admin pages + API routes
- All 6 admin list pages (dashboard, members, events, news, committee, users) scoped
- All API routes (members, events, news, committee, users, tasks + [id] routes) scoped
- POST /api/members creates MemberAssociation link in same transaction

### Step 5 — Platform panel ✓
- Routes: /platform/login, /platform/dashboard, /platform/associations, /platform/associations/[id], /platform/logs
- lib/platformAuth.ts: reads platform-session-token cookie, decodes JWT
- app/api/platform-auth/route.ts: POST login (sets JWT cookie), DELETE logout
- Middleware: assoc-platform.nibjar.com → enforces platform-session-token
- Platform sidebar uses indigo theme, distinct from association admin panels

### Step 5.5 — Platform create/edit association ✓
- /platform/associations/new — form: name, slug, domain, foundedYear, description, plan
- /platform/associations/[id]/edit — full edit form (AssociationEditForm.tsx client component)
- /api/platform/associations — POST create
- /api/platform/associations/[id] — PUT update
- "New Association" button on list page, "Edit" button on detail page

### Step 5.6 — Admin member visibility toggle ✓
- /api/members/[id]/visibility — PATCH updates MemberAssociation.visible
- components/admin/VisibilityToggle.tsx — client toggle with useTransition + router.refresh()
- /admin/members — now queries ALL members (visible + hidden) via memberAssociation.findMany

### Step 5.7 — Membership applications ✓
- MembershipApplication model: id, venueName, ownerName, phone, email, location, capacity?, website?, status, associationId?, createdAt, updatedAt
- Migration: 20260609091232_add_membership_application
- /api/membership-applications — POST (public, scoped by domain) / GET (admin only)
- /api/membership-applications/[id] — PATCH (status update), DELETE
- /admin/applications — list with status filter chips, detail panel, status update, delete
- MembershipForm.tsx — now POSTs to /api/membership-applications with error handling

### Step 6 — Dynamic PWA manifest ✓
- /api/manifest/route.ts — returns manifest.json driven by Association record
- Returns name, short_name, description, icons (logo), theme_color, background_color per association
- app/layout.tsx — manifest: "/api/manifest" added to generateMetadata return

Add this at the very BOTTOM of your progress.md

---

## Phase 3 — Membership Management ✓ COMPLETE

Built: MembershipCategory admin, DuesPayment admin (record/mark-paid), fee schedule per category.

API routes: /api/membership/categories, /api/membership/categories/[id], /api/membership/dues, /api/membership/dues/[id], /api/membership/member-category/[id]
Admin pages: /admin/membership/categories, /admin/membership/dues

---

## Phase 3 — Membership Management (ORIGINAL NOTES — NOT STARTED — discuss before building)

EVA Nepal members pay annual dues and hold membership tiers.
This phase adds the ability to track who has paid, who is lapsing, and what tier they hold.

Planned scope:

- [ ] Discuss and finalize data model before any code
- [ ] MembershipPlan model (name, price, duration in months, benefits)
- [ ] MembershipRecord model (member FK, plan FK, start date, end date, status: active/lapsed/pending)
- [ ] DuesPayment model (record FK, amount, paid date, payment method, receipt number)
- [ ] Migration: add membershipStatus field to Member (active/lapsed/none)
- [ ] Admin: /admin/membership/plans (list + create + edit)
- [ ] Admin: /admin/membership/records (list, filter by status, mark as paid)
- [ ] Admin: /admin/members updated to show membership badge per member
- [ ] Public: member profile page shows membership status badge
- [ ] progress.md + system_snapshot.md updated  


Cross-module rule: member status must stay in sync with MembershipRecord — no manual overrides.

---

## Phase 4 — Member Portal ✓ COMPLETE

Built: Cookie-based portal auth (member-portal-token JWT), portal login page, portal layout with sidebar, dashboard, events+RSVP, meetings+RSVP+minutes, dues history. Admin portal-accounts page (create/reset/delete).

Auth: lib/portalAuth.ts → getPortalUser(). Middleware protects /portal/* (except /portal/login).
Portal routes: /portal/login, /portal (dashboard), /portal/events, /portal/meetings, /portal/dues
Admin: /admin/portal-accounts
API: /api/portal-auth, /api/portal/me, /api/portal/events, /api/portal/meetings, /api/portal/dues, /api/portal/rsvp/events/[id], /api/portal/rsvp/meetings/[id], /api/admin/portal-accounts, /api/admin/portal-accounts/[id]

---

## Phase 4 — Member Portal (ORIGINAL NOTES — NOT STARTED — discuss before building)

Members log in to a private area to view their membership, event history, and payments.  
 This is a separate authenticated surface from /admin.

Planned scope:

- [ ] Discuss portal scope and UX before any code
- [ ] MemberAccount model (email, passwordHash, member FK, lastLoginAt)
- [ ] Portal auth — credentials provider separate from AdminUser/NextAuth admin session
- [ ] Portal routes: /portal/login, /portal/dashboard, /portal/membership, /portal/events, /portal/payments
- [ ] Member can see: membership status + renewal date, events they registered for, payment history
- [ ] Admin can create/reset portal accounts for members
- [ ] progress.md + system_snapshot.md updated  


Design rule: /portal/_ is a completely separate route group from /admin/_.  
 Members never see admin data. Admins never log in via portal.

---

## Phase 5 — Event Ticket Sales (NOT STARTED — discuss before building)

Events will have ticketed capacity. Public and members can purchase tickets.  
 Revenue from tickets must flow into a reporting view.

Planned scope:

- [ ] Discuss pricing model and flow before any code
- [ ] TicketType model (event FK, name, price, totalCapacity, soldCount)
- [ ] TicketPurchase model (ticketType FK, buyerName, buyerEmail, buyerPhone, amount, status, purchasedAt)
- [ ] EventAttendance model (ticketPurchase FK, checkedInAt, checkedInBy)
- [ ] Public: event detail page shows ticket types + purchase flow
- [ ] Admin: /admin/events/[id]/tickets — ticket type management + attendee list + check-in
- [ ] Admin: /admin/events/[id]/revenue — income summary for the event
- [ ] Cross-module wiring (all must happen together):
    - [ ] Ticket sold → soldCount increments on TicketType
    - [ ] Ticket sold → TicketPurchase record created
    - [ ] Check-in → EventAttendance record created
    - [ ] Event revenue → visible in reporting dashboard
- [ ] progress.md + system_snapshot.md updated  


---

## Phase 6 — Meeting / Agenda Module ✓ COMPLETE

Built: Meeting CRUD, AgendaItem management (tabbed), Expenses (vendor list + free text), MemberContributions, MeetingMinutes (upsert + publish).

API routes: /api/meetings, /api/meetings/[id], /api/meetings/[id]/agenda, /api/meetings/[id]/agenda/[itemId], /api/meetings/[id]/minutes, /api/meetings/[id]/expenses, /api/meetings/[id]/expenses/[expenseId], /api/meetings/[id]/contributions, /api/meetings/[id]/contributions/[contribId], /api/expense-vendors
Admin pages: /admin/meetings, /admin/meetings/new, /admin/meetings/[id] (4-tab detail)

---

## Phase 6 — Meeting / Agenda Module (ORIGINAL NOTES — NOT STARTED — discuss before building)

AGM, committee meetings, and special meetings with structured agendas and published minutes.

Planned scope:

- [ ] Discuss what meetings need to track before any code
- [ ] Meeting model (title, type: AGM/committee/special, scheduledAt, venue, status: scheduled/completed/cancelled)
- [ ] AgendaItem model (meeting FK, order, title, description, outcome)
- [ ] MeetingMinutes model (meeting FK, content, approvedAt, publishedAt)
- [ ] Admin: /admin/meetings (list + create + edit + add agenda items + record minutes)
- [ ] Public: published minutes visible at /meetings or similar
- [ ] progress.md + system_snapshot.md updated  


Date anchor: scheduledAt field for all meeting queries.

---

## Phase 7 — Reporting Dashboard ✓ COMPLETE

Built: /admin/reports page + /api/admin/reports GET endpoint.

Metrics: dues collected/pending (by month + by category), expenses by meeting, member contributions (top 10), member growth by month, event attendance (RSVPs), meeting attendance (RSVPs), net balance summary, portal account adoption rate.
No new npm deps — CSS bar charts only.

---

## Phase 7 — Reporting Dashboard (ORIGINAL NOTES — NOT STARTED — discuss before building)

Summary view for the admin to understand membership health and event performance.

Planned scope:

- [ ] Discuss what metrics matter most before building
- [ ] Member growth over time (new members per month/year)
- [ ] Membership dues: total collected, outstanding, lapsing soon
- [ ] Event attendance: per-event headcount and revenue
- [ ] Income breakdown: dues vs ticket sales vs other
- [ ] Admin: /admin/reports with chart views  


Rule: every income source must be wired at the time it is built.  
 No income source may be added later without also wiring it into reports here.  
 Partial reporting is a bug.

---

## Member Form + Members Admin Overhaul ✓ COMPLETE

### Schema additions (migrations applied + prisma generate run)
- `Member.facebook String?` — migration 20260610070809_add_social_media_to_member
- `Member.instagram String?`
- `Member.youtube String?`
- `Member.latitude Float?` — migration 20260610072559_add_lat_lng_to_member
- `Member.longitude Float?`
- `lib/types.ts` MemberType updated with all 5 new fields

### MemberForm.tsx — full 5-step guided rewrite (components/admin/MemberForm.tsx)
- Step 1: Name, slug (auto-fill + prefix display), Member Since with BS↔AD converter, Featured
- Step 2: Area, Address, Capacity (tier label), Nominatim geocoding → OSM map preview, manual lat/lng override
- Step 3: Category multi-select (CheckCards), Type multi-select, Description + Auto-Generate button (4 random templates)
- Step 4: Multiple phones (Nepali validation regex), Email, Website, Facebook/Instagram/YouTube
- Step 5: 26 amenities checkbox grid, Image upload, Review summary, Save
- On submit: lowercases area/location/category/type/amenities, capacity→number, phones joined comma-separated

### API fix (app/api/members/route.ts)
- POST handler wrapped prisma.$transaction in try/catch — returns JSON error instead of empty 500

### Members admin page (app/(admin)/admin/members/)
- MembersClient.tsx: search, area/category/visibility filters, sortable columns, pagination (25/page), stats bar
- Server page passes all MemberRow[] to client

### Public member profile page (app/members/[slug]/page.tsx)
- Profile image: conditional <Image> when member.image set, fallback Building2 icon
- Multiple phones: split by comma, each as separate link
- Social media icons: Facebook/Instagram/YouTube with smart URL handling
- "Get Directions" button (emerald) when lat/lng set → Google Maps directions URL
- OpenStreetMap embed iframe when lat/lng set
- "Open in Google Maps for directions" text link below map

### Admin layout (app/(admin)/admin/layout.tsx)
- Added: Portal Accounts (KeyRound icon), Reports (BarChart2 icon) nav links

---

## Pending (real-world content, not code)

| Item                                              | Where                                  |
| ------------------------------------------------- | -------------------------------------- |
| Real phone/email/social URLs                      | /admin/settings                        |
| Replace metadataBase URL                          | app/layout.tsx                         |
| Add favicon.ico + og-image.jpg (1200x630)         | /public/                               |
| Wire membership form to email (Resend/Nodemailer) | components/sections/MembershipForm.tsx |
| Real venue photos                                 | Admin panel → Members                  |
| Real committee photos                             | Admin panel → Committee                |
| Update nginx.conf server_name                     | nginx.conf                             |
| Set up SSL via Certbot                            | Server-side after DNS                  |
| Change default admin password                     | DB direct or new endpoint              |
| Set NEXTAUTH_SECRET in production                 | .env.local on server                   |

---
