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

Re-audited 2026-08-27 against actual code (this table + the near-duplicate one near end of file had gone stale — several rows were already done under later phases). Consolidated, verified list:

**Already resolved — no longer pending (verified in code):**
- ~~Replace metadataBase URL~~ — `app/layout.tsx` builds it dynamically per-association domain (multi-tenancy)
- ~~Add og-image.jpg (1200×630)~~ — `app/opengraph-image.tsx` now generates a branded OG image dynamically via `next/og` (real logo + name + description per association, no static file needed)
- ~~favicon.ico~~ — present in `/public/`
- ~~Wire membership form to email~~ — `POST /api/membership-applications` already calls `sendMail()` (admin notify + applicant confirmation)
- ~~Add ANTHROPIC_API_KEY~~ — obsolete; AI generation runs on Groq (`GROQ_API_KEY`), not Anthropic

**Still genuinely pending — needs real content/credentials/server access, not code:**
| Item                                        | Where                                                              |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Real phone/email/social URLs                 | `/admin/settings` (already wired end-to-end — just needs real values entered; dashboard checklist tracks this) |
| Real venue photos for member profiles        | Admin panel → Members → upload image per member                    |
| Real photos for committee members            | Admin panel → Committee → upload image per member                  |
| Update nginx.conf server_name (currently `evanepal.org`, actual prod domains are `eva.nibjar.com`/`bhaktapur.nibjar.com`) | `nginx.conf` |
| Set up SSL via Certbot                       | Server-side after DNS points                                        |
| Change default admin password                | `/admin/users` (flagged in dashboard onboarding checklist)          |
| Confirm NEXTAUTH_SECRET set in production    | `.env.local` on server                                              |

---

## Feature — Visual overhaul Checkpoint 1: foundation + sidebars + logins + dashboards ✓ COMPLETE (2026-08-27)

User feedback: admin/portal/platform panels looked like a generic SaaS dashboard template (plain white
cards, ad-hoc Tailwind grays, no motion), disconnected from the already-polished public site. Full plan at
`.claude/plans/federated-stargazing-squirrel.md`. Delivered as a checkpoint — this covers foundation +
sidebars + logins + dashboards only; the list/table pages (Members, Events, News, Committee, Meetings, Dues,
Users, Designations, Finances, Timeline, Applications, Portal Accounts) are a separate follow-up.

- **`components/ui/panel/`** (new shared library, reused across admin/portal/platform):
  `accent.ts` (gold vs indigo token config), `useCountUp.ts` (extracted from `StatsSection.tsx`'s existing
  counter, not reinvented), `PanelCard.tsx`, `StatCard.tsx`, `Badge.tsx`, `PanelTable.tsx`/`PanelTableRow.tsx`
  (shell only — columns/sorting stay page-specific), `EmptyState.tsx`, `ConfirmDialog.tsx` (formalizes the
  existing `confirmDeleteId` pattern into a shared animated modal — `window.confirm()` is still never used),
  `SidebarNavItem.tsx` (Framer Motion `layoutId` sliding active-indicator), `AuthCard.tsx` (+`AuthInput`,
  `AuthSubmitButton` — extracted from `admin/login/page.tsx`'s already-good glass/gradient/bokeh shell).
- **`app/globals.css`** — added indigo siblings of the existing gold utilities (`.bg-mesh-indigo`,
  `.text-gradient-indigo`, `.indigo-divider`, `.animated-gradient-border-indigo`, `.indigo-glow-pulse` +
  `glowPulseIndigo` keyframe) so Platform gets the same polish under its own distinct brand color (kept
  intentionally different from admin/portal gold — signals "internal tool," decided with user).
- **Sidebars** — all 3 (`admin/layout.tsx`, `portal/layout.tsx`, `platform/layout.tsx`) rebuilt on
  `SidebarNavItem` + `bg-mesh-navy`/`bg-mesh-indigo`. Platform's sidebar had no mobile responsiveness at all
  before this (fixed `ml-60`, no hamburger) — added the same mobile drawer pattern admin/portal already had.
  All existing logic (role-aware filtering, notification badge, branding fetch, sign-out redirect) untouched.
- **Logins** — portal and platform logins (previously plain Tailwind / a hand-coded partial re-derivation of
  the glass system) now use `AuthCard`, matching admin login's existing quality. Platform has no logo image,
  so `AuthCard` gained a `brandIcon` fallback (icon tile instead of `<Image>`) for that case.
- **Dashboards** — admin (`DashboardClient.tsx`), portal (`portal/page.tsx`), platform (`dashboard/page.tsx`)
  stat grids now sit in a `bg-mesh-navy`/`bg-mesh-indigo` banner using `StatCard` (count-up numbers, icon
  tiles, hover glow line). Server-side data-fetching in every dashboard page is untouched — only the
  presentational layer changed.
- **Real bug found + fixed during this**: `platform/dashboard/page.tsx` is a Server Component that was
  passing Lucide icon *components* (not elements) directly as props to the client `StatCard` — Next.js RSC
  does not allow function/component references across that boundary ("Functions cannot be passed directly to
  Client Components"). Extracted `StatsRow.tsx` (client component owning its own icon set) so the server page
  only passes plain serializable numbers. General lesson: any Server Component rendering one of these shared
  client primitives must never pass a raw icon/component reference as a prop — pass data, let the client
  component pick its own icons, or pass an already-instantiated `<Icon />` element (which IS serializable).
- Verified via `tsc`/`npm run build` (clean) and full browser walkthrough of all 3 sidebars/logins/dashboards
  logged in as real accounts — count-up animations, active-nav sliding indicator, collapse/expand, and mobile
  drawer all confirmed working. (One transient false alarm: after the RSC fix, the dev server's `.next` cache
  stayed in a degraded state showing unstyled/empty content even after rebuild — resolved with a clean
  `rm -rf .next` + dev server restart, not a real remaining bug.)

---

## Feature — Visual overhaul Checkpoint 2: list/table pages ✓ COMPLETE (2026-08-27)

Follow-up to Checkpoint 1 above — rolled the `components/ui/panel/` shared library out to all ~21 remaining
admin/portal/platform list/table pages that still used ad-hoc `bg-white rounded-xl border border-gray-100`
markup and hand-rolled badges/confirm-delete UI. No schema, API, or business-logic changes — presentational
layer only, per LAW 2.

- **Admin**: `MembersClient`, `EventsClient`, `NewsClient`, `CommitteeListClient`, `MeetingsListClient`,
  `activity/page`, `UsersClient`, `DesignationsClient`, `portal-accounts/page`, `tasks/page` (conservative —
  only the create-form panel + empty state, per-task cards and nested subtask/comment confirm states left
  alone — see decision below), `TimelineClient`, `FinancesClient`, `membership/dues/page`,
  `applications/page`.
- **Portal**: `portal/meetings/page`, `portal/events/page`, `portal/dues/page`.
- **Platform**: `platform/associations/page`, `platform/associations/[id]/page`, `platform/logs/page`.
- **`components/ui/panel/PanelTable.tsx`** — `PanelTableRow` gained an optional `onClick?: () => void` prop
  (needed for `applications/page.tsx`'s clickable master-detail rows) — the only shared-library API change.
- **Two standing rules applied consistently across every file**, decided to avoid regressions/incoherent UX:
  1. Variable/many-color badges (5+ category colors — event type, news category, meeting type, activity-log
     action, finance account type) are **left as plain `<span>` + their existing `*_COLORS` lookup**, not
     forced into `Badge`'s fixed tone palette (`success/warning/danger/neutral/info`) — combining Badge's
     baked-in tone classes with arbitrary extra bg/text/border classes in one `className` string produces
     unpredictable Tailwind conflicts (CSS cascade order, not prop order, wins).
  2. Simple top-level `confirmDeleteId` + inline Yes/No UI migrated to the shared `ConfirmDialog` modal.
     Deeply-nested or multi-sibling confirm states were left inline as-is: `tasks/page.tsx` (3 separate
     confirm states for task/subtask/comment), `applications/page.tsx`'s sidebar (3 sibling accept/reject/
     delete confirms — converting only delete would look inconsistent), `FinancesClient.tsx`'s
     `confirmCloseYearId` (a distinct non-delete action).
  - `dues/page.tsx` desktop rows deliberately kept as plain `motion.tr layout` (not `PanelTableRow`, which
    doesn't support the `layout` prop) to preserve the existing drag-reorder animation.
- Verified via `npx tsc --noEmit` (clean, no exceptions across all 21 files) and a final `npm run build`
  (clean, all routes compiled) after every file and again at the end.
- Nothing committed — all changes left in the working tree per this session's standing instruction.

---

## Fix — Multi-tenant polish: generic logo fallback, person-mode admin list, generic placeholders, full SiteSettings seeding ✓ COMPLETE (2026-08-28)

Found via user manual testing of a real second association ("Namo Udyam", `member_mode = "person"`). Root cause across
all items: the platform was generalized for multi-tenancy on the **public site** (Phase B) and in the DB layer, but
several admin-panel and fallback code paths still hardcoded EVA Nepal-specific assumptions.

- **Admin logo fallback**: `app/(admin)/admin/layout.tsx` fell back to EVA's real logo file when an association had
  none set. Replaced with a generic icon tile (gold circle + institution icon); association name now shown next to it.
- **Generic logo fallback, platform-wide**: same EVA-logo-fallback bug found in 9 more places (public Navbar, Footer,
  OG image generator, PWA manifest, favicon metadata, portal login, admin login ×2). Created `public/default-logo.png`
  (neutral navy/gold mark, no brand-specific content) and swapped every fallback site to use it. `eva-nepal` and
  `bhaktapur` both have their own `logo` set in the DB so they're unaffected — only associations without a logo now
  show the generic mark instead of EVA's.
- **Admin Members list now respects `member_mode`**: `admin/members/page.tsx` + `MembersClient.tsx` fetch `member_mode`
  from `SiteSettings` and adjust header copy/icon, "Area"→"Location"/"Category"→"Profession" labels, hide the
  venue-only Capacity column, CSV export headers, and relax the "incomplete profile" check (Owner Name/Capacity/Address
  are venue-only requirements) — mirrors what the public site already did, but the admin panel never had this wiring.
- **Generic placeholder text**: removed hardcoded `EVA Nepal` / `Hotel Annapurna` / `150 members` / `evanepal.org`
  example text from `EventForm`, `NewsForm`, `CommitteeForm`, `MemberForm`, meeting creation, admin login, new-user form.
- **Full `SiteSettings` seeding**: `POST /api/platform/associations` previously only seeded the `member_mode` row —
  every other Settings tab (Contact/Social/Stats/Footer/Hero/Assets) showed "not configured" permanently for any new
  association, and even `eva-nepal` itself never had Footer/Hero/Assets rows. Now seeds all 13 known keys across all
  7 groups (empty string values — admin fills in real data). Backfilled the same missing rows onto the 2 existing
  associations (additive only, `ON CONFLICT DO NOTHING`, never overwrote existing values). Also found and fixed:
  `bhaktapur` had a real `footer_tagline` value stuck under a stray `group = "content"` that no Settings tab reads —
  relabeled to `group = "footer"` so it's now visible/editable.
- **Related bug fixed while seeding**: `components/sections/Contact.tsx` and `components/layout/Footer.tsx` had
  hardcoded EVA-specific fallback text (`info@evanepal.org`, `Maitidevi, Kathmandu`) that would display on ANY
  association's public site until an admin filled in real settings — genericized fallbacks, and switched a few
  `??` checks to `||` since `??` doesn't fall back on the newly-seeded empty-string values (only null/undefined).
- Verified via `npx tsc --noEmit` and `npm run build` (both clean) after every step.
- **Deferred items — now also complete, same session**: see next entry below for the person-mode `MemberForm` and
  `CommitteeMember`↔`Member` linking work.

---

## Feature — Committee role category now pulls from per-association Designations ✓ COMPLETE (2026-08-28)

Follow-up discussion after the item above: user asked whether the Committee "Role Category" picker
(hardcoded 8-option list: President, Vice President, Secretary, Treasurer, etc.) should instead be
dynamic per association, since different association types have different committee structures.
Agreed approach: reuse the existing `Designation` model rather than invent a new one — it's already
the per-association role vocabulary shared by `AdminUser.designationId` and
`MemberAssociation.designationId`; Committee was the missing third consumer.

- **Migration**: `CommitteeMember.designationId String?` (FK → Designation, additive/nullable per LAW 3).
  `npx prisma generate` run after.
- **`CommitteeForm.tsx`**: Step 1's Role Category picker now renders the association's actual
  `Designation` rows (fetched server-side in `committee/new` and `committee/[id]` pages, same prop
  pattern as the existing member picker) when any exist; falls back to the original hardcoded
  `ROLE_KEYS` grid only if the association has zero Designations (safety net, not expected to trigger
  for any association created after Phase A). Picking a designation auto-fills the role title (existing
  bilingual auto-translate pipeline untouched) and derives `roleKey` — the fixed key the public
  Committee page uses for its EN/NE translation lookup — by matching the designation's name against
  the 8 known titles case-insensitively, defaulting to `"member"` (a valid, always-translated key) for
  any custom designation name that doesn't match.
- **Real gap found while backfilling test data**: `eva-nepal` and `bhaktapur` (both created before the
  Designation-seeding feature existed) had **zero** `Designation` rows — only `namo-udyam` (created
  after) had the 6 defaults. Backfilled the same `DEFAULT_DESIGNATIONS` list (`lib/permissions.ts`)
  onto both via a `NOT EXISTS`-guarded insert (additive, idempotent, never touches existing rows) so
  the new picker is actually testable as dynamic on the two real associations, and so their
  `/admin/designations` and `/admin/users` role-assignment pages have real data to work with.
- **Related gap found, NOT fixed (out of scope, flagged for later)**: `CommitteeMember.roleNe` (the
  Nepali role title — already captured and auto-translated in the admin form, already stored in the DB)
  is never fetched or passed through to the public Committee page at all — `CommitteeType` in
  `lib/types.ts` and `app/page.tsx`'s data mapping simply don't include it. This means ANY custom role
  title (hand-typed or now designation-derived) that doesn't match one of the 8 fixed translation keys
  displays in English even in Nepali locale. Pre-existing, not introduced by this change, and touches
  public-site "locked" components + the shared `CommitteeType` interface — left alone pending a
  separate discussion.
- Verified via `npx tsc --noEmit` + `npm run build` (both clean) and curl end-to-end: created a real
  committee member with `designationId` set, confirmed `roleKey` derived correctly, confirmed the
  Designation FK relation resolves via a DB join, cleaned up the test record. (One unrelated hiccup:
  running `npm run build` while `npm run dev` was live against the same `.next` directory corrupted the
  dev server's build cache — same known issue documented in memory `deployment-and-ops.md`; fixed with
  `rm -rf .next` + dev server restart, not a real bug.)

---

## Feature — Delete Association (platform panel) ✓ COMPLETE (2026-08-28)

User requested a way to permanently remove an unused/test association and all its data from the
platform panel — this capability didn't exist at all before (no DELETE route, no delete UI anywhere).

- **Schema audit first**: 20 of the 27 models with an `associationId` FK already have
  `onDelete: Cascade` and clean up automatically when the Association row is deleted. **7 do not**
  (all have an *optional* `associationId` with no cascade specified): `Event`, `News`,
  `CommitteeMember`, `AdminUser`, `SiteSettings`, `MembershipApplication`, `ApiLog` — deleting an
  Association with any of these rows still attached would fail on a FK constraint.
- **`DELETE /api/platform/associations/[id]`**: requires the platform user to pass
  `{ confirmSlug }` matching the association's actual slug exactly (checked server-side, not just in
  the UI) — deletes nothing if it doesn't match. In one `$transaction`: explicitly `deleteMany`s the 7
  non-cascading models first (`AdminUser`/`CommitteeMember` deliberately go first — both also carry a
  separate `designationId` FK to `Designation`, which itself cascades away automatically once the
  Association is deleted; deleting them ahead of time avoids a second-order FK violation from a
  surviving row pointing at a Designation that's about to vanish), then deletes the `Association` row,
  which cascades the other 20 models via Postgres. **`Member` rows themselves are deliberately NOT
  deleted** — they're the shared multi-tenant entity; only this association's `MemberAssociation` link
  to them is removed via cascade, so a member registered in multiple associations isn't affected.
  Logs the action (who, when, which association, exact deleted-row counts) via `console.log` for the
  PM2 log trail — no platform-level audit-log table exists to write to instead.
- **`DeleteAssociationButton.tsx`**: a "Danger Zone" section on the platform association detail page.
  Modal shows exactly what will be deleted (real counts pulled from the page's existing `_count` query)
  and requires typing the association's slug to enable the delete button — not a plain yes/no.
- **Verified end-to-end on a disposable test association** (created via the real
  `POST /api/platform/associations` flow, `slug: "delete-test-assoc"`, never one of the real
  associations): populated all 7 non-cascading models plus several cascading ones (Designation incl. a
  `CommitteeMember.designationId` link — the trickiest ordering case — FinancialYear, FinancialAccount),
  confirmed a wrong `confirmSlug` is rejected and deletes nothing, then confirmed the correct slug
  deletes everything — re-queried all 10 tables post-delete, all zero rows — and confirmed `eva-nepal`,
  `bhaktapur`, and `namo-udyam` were completely untouched throughout.
- **Not yet done / explicitly out of scope for this pass**: no "export before delete" / backup step
  built into the flow itself — if this is ever run against production, back up the database first,
  since the action is genuinely irreversible and this feature does not create its own safety net beyond
  the typed confirmation.

---

## Fix — Activity Log page stuck on "Loading activity…" forever + UI polish ✓ COMPLETE (2026-08-29)

**Root cause**: `app/(admin)/admin/activity/page.tsx`'s `load()` function had zero error handling —
`fetch()` and `res.json()` calls weren't wrapped in try/catch, and `setLoading(false)` was the very
last line of the function. If the fetch or JSON parse threw for ANY reason (network blip, slow
response, non-JSON error page), the function threw before reaching that line and the loading spinner
stayed on-screen forever — no error message, no way to recover except a full page reload. Confirmed
locally (as `namoAdmin`) that `/api/admin/activity` itself returns correctly and fast — this was a
client-side resilience gap, not a broken endpoint; whatever triggered it in production (transient
network issue, slow response) will happen again to *some* request eventually without this fix.
- Wrapped the fetch in `try/catch/finally` — `setLoading(false)` now always runs in `finally`, so the
  spinner can no longer get stuck no matter what fails.
- Added a proper error state (amber warning icon + message + "Try again" button) instead of silently
  doing nothing on failure.
- **UI polish** (also requested): added a manual "Refresh" button in the header, per-entity-type icons
  (member/event/news/committee/meeting/task/application/dues) on each log row (desktop + mobile),
  switched the timestamp from a raw `YYYY-MM-DD HH:mm` string to a locale-safe relative "2h ago" /
  "3d ago" format (full timestamp still available via a `title` tooltip on hover) — matches the
  project's locale-safe-date-formatting rule (no `toLocaleDateString`/`toLocaleString`), and the
  entry-count subtitle now shows "…" while loading instead of a misleading "0 entries" before the
  real count arrives.
- Verified via `npx tsc --noEmit` (clean) and curl (page loads clean, `/api/admin/activity` confirmed
  fast and correct against a real `namo-udyam` admin session, zero error markers).

---

## Feature — Public homepage now respects member_mode (venue vs person) ✓ COMPLETE (2026-08-29)

User tested `namoudyam.nibjar.com` (person-mode association) in production and found the ENTIRE
public homepage still showed venue-specific copy, images, and fake stats — a much larger gap than
the admin-panel work from 2026-08-28. Root cause: `lib/i18n.ts` was a single static `en`/`ne` object
with hardcoded venue copy for `hero`, `about`, `mission`, `members`, `whyjoin`, `join`, `footer` —
no `member_mode` branching existed anywhere in it, and several homepage sections (`Hero`,
`MemberDirectory`, `WhyJoin`, `About`) had additional hardcoded venue text/images living directly in
JSX, outside the translation system entirely.

- **`lib/i18n.ts` restructured**: `hero`/`about`/`mission`/`members`/`whyjoin`/`footer` now each have
  parallel `venue`/`person` copy variants (English + Nepali, hand-written, not auto-translated) under
  the same locale objects. Added `resolveTranslations(locale, memberMode)` which flattens the right
  variant into the exact same shape components already consumed (`t.hero.subtitle` etc.) — this means
  most components (`Mission.tsx` fully, others partially) needed **zero code changes**, they just
  started receiving correct copy automatically once the context became mode-aware.
- **`LocaleContext.tsx`**: `LocaleProvider` now takes a `memberMode` prop and calls
  `resolveTranslations()` instead of reading the raw locale object directly.
- **`app/layout.tsx`**: `RootLayout` converted to async, fetches `member_mode` via
  `getAssociation()` + `getSettings()` (same pattern as `generateMetadata()` in the same file) and
  passes it into `LocaleProvider`. Harmless no-op under `/admin`, `/portal`, `/platform` — those
  never call `useLocale()`.
- **Components that also needed an explicit `memberMode` prop** (because they swap *images* or hide
  *whole sections*, which can't come from a translation string): `Hero.tsx`, `About.tsx`,
  `MemberDirectory.tsx`, `WhyJoin.tsx`. `app/page.tsx` now passes `memberMode` (already computed
  there, explicitly typed as the `"venue" | "person"` union) to all four.
- **`Hero.tsx`**: split the venue-only Unsplash slideshow (`VENUE_SLIDES`) into a parallel
  `PERSON_SLIDES` array with professional/networking imagery; the two floating thumbnail cards and
  the "Member Venues" stat badge now swap per mode too. **Also fixed a real, mode-independent bug
  while in here**: the "Annual Events" stat was `value: "20+"` — a literal hardcoded string, never
  wired to any prop at all, so it always showed a fake number regardless of the association's real
  event count (Namo Udyam has 0 events, still showed "20+"). Added an `eventsHosted` prop, wired from
  the same `eventsHosted` value `StatsSection` already correctly received.
- **`MembershipForm.tsx` (public "Join" application form) is now hidden entirely in person-mode
  associations** — per the original `platform-design.md` intent ("No public application form in
  person mode. Admin creates members directly.") that was apparently never implemented. `app/page.tsx`
  now wraps it in `{memberMode !== "person" && <MembershipForm ... />}`.
- **`Footer.tsx` copyright line fixed**: was `{t.footer.association}` — a hardcoded i18n string
  ("Event and Venue Association Nepal") completely ignoring the `settings.name` prop already being
  passed in. Now uses `settings?.name`. Also fixed the hardcoded `&copy; 2025` to
  `{new Date().getFullYear()}`.
- **`app/members/MembersClient.tsx` (full `/members` listing page) subtitle fixed**: was
  `{t.members.subtitle}`, a translation string with a hardcoded "150+" baked directly into the
  copy — meaning even `eva-nepal`'s own `/members` page always claimed "150+ registered event venues"
  regardless of the real count. Removed `subtitle` from the i18n `members` section entirely and built
  it dynamically from `members.length` instead (component already receives the real array).
- **Platform panel browser tab title fixed** (found while investigating the above): `/platform/*`
  pages showed the EVA Nepal fallback title because `getAssociation()` never matches
  `assoc-platform.nibjar.com` to any real Association row, so the root layout's `generateMetadata()`
  fell through to its hardcoded EVA default. `app/(platform)/platform/layout.tsx` now sets its own
  `title: { absolute: "Nibjar Platform", template: "%s | Nibjar Platform" }` — note **`absolute`, not
  `default`** was required; `default` still gets wrapped by the parent layout's own title template
  (confirmed via curl: `default` produced "Nibjar Platform | Namo Udyam" instead of just "Nibjar
  Platform" — a real Next.js metadata-merging nuance worth remembering).
- **Verified via `npx tsc --noEmit`** (clean throughout) **and curl against the live local dev
  server** (namo-udyam, person mode): zero occurrences of "Member Venues"/"Grand Banquet Hall"/
  "Wedding Venue"/"premier venue network"/"professional venues" anywhere on the homepage; "Featured
  Members"/"professional network"/"registered members" all present; the public application form
  section completely absent from the rendered HTML; the Hero events stat correctly shows "0+" instead
  of the old fake "20+"; footer copyright correctly reads "© 2026 Namo Udyam"; platform title
  correctly reads "Nibjar Platform". Full 7-route error-marker sweep across public + all three auth
  surfaces came back clean.
- **Follow-up round found + fixed 2 more instances of the same pattern** (user reviewed the live
  result and flagged them): `StatsSection.tsx`'s "Events Hosted" description ("Across all member
  venues collectively") and its bottom tagline ("Nepal's Premier Event & Venue Association · Est.
  {year}") were both still hardcoded venue-only text despite the component already having
  `isPersonMode` logic for its first stat card. Also found the **browser tab title itself** —
  `app/layout.tsx`'s `generateMetadata()` — had the exact same "Kathmandu's Premier Venue
  Association" hardcoded suffix (title showed this for `namoudyam.nibjar.com` despite it being
  person-mode) and a hardcoded EVA-specific `description` meta-tag fallback; both now branch on
  `settings.member_mode`.
- **Layout bug fixed**: `About.tsx`'s floating "Members/Member Venues" stat card (positioned
  `-bottom-6 -left-6`, deliberately overlapping the image's bottom-left corner) was visually
  covering part of the image's own caption text in that same corner — likely pre-existing for venue
  mode too, just more visible now since the person-mode caption text wraps to 2 lines. Fixed by
  adding extra bottom padding (`pb-20`) to the image's caption text block so it clears the floating
  card's footprint regardless of text length/language.
- **Not fixed, out of scope for this pass**: this only covers the **public homepage**
  (`app/page.tsx`'s sections). The standalone `/events`, `/news`, `/meetings`, `/committee` pages and
  their detail pages were not audited for the same hardcoded-venue-copy pattern — worth a follow-up
  sweep if person-mode associations report more of this. Also noted but not fixed: the "Apply for
  Membership" CTA in `WhyJoin.tsx` still links to `/#join`, which no longer exists on the page in
  person mode since `MembershipForm` is now hidden there — clicking it currently just does nothing
  (no crash, dead anchor). Needs a decision on where it should point instead for person-mode
  associations (Contact section? Removed entirely?) before fixing.

---

## Fix — Platform API routes blocked on the real platform domain ✓ COMPLETE (2026-08-29)

Found during first real production deploy: "Create Association" failed with `Unexpected token '<',
"<!DOCTYPE "... is not valid JSON`, and `/api/manifest/platform` threw `Manifest: Line 1, column 1,
Syntax error` in the console. Root cause: `middleware.ts`'s platform-domain block (hostname ===
`assoc-platform.nibjar.com`) only ever allowlisted `/platform` and `/api/platform-auth` — every other
path, including `/api/platform/associations` (create), `/api/platform/associations/[id]` (edit/
delete), `/api/platform/associations/[id]/reset`, and today's new `/api/manifest/platform`, got
redirected to the `/platform/login` HTML page instead of reaching the route handler. **Pre-existing
bug, not introduced today** — it only manifests on the real platform hostname; local dev takes a
completely different, more permissive branch of the same middleware (`NODE_ENV !== "production"`),
which is exactly why none of this session's extensive local curl testing of the associations
create/delete/reset endpoints ever caught it. Fixed by allowlisting `/api/platform` (covers all
`/api/platform/*` sub-routes) and `/api/manifest` on the platform domain, alongside the existing
`/api/platform-auth` and `/platform` allowlist entries. Each of those API routes already
self-protects via `getPlatformUser()` inside the handler, so this doesn't weaken auth — it just lets
requests reach the handler that was already checking auth correctly. Verified via `npx tsc --noEmit`
(clean) and confirmed on production after redeploy — Create Association now works.

## Fix — Deprecated `apple-mobile-web-app-capable` meta tag ✓ COMPLETE (2026-08-29)

Chrome console warning (not a functional bug) on every page. Next.js's `metadata.appleWebApp.capable`
field only emits the legacy Apple-specific tag; the modern replacement (`mobile-web-app-capable`,
also honored by Chrome/Android) has no dedicated Metadata API field. Added it manually via
`metadata.other` in the root `app/layout.tsx`, alongside the existing `appleWebApp` block — both tags
now render. Verified via `npx tsc --noEmit` and curl (both meta tags present in rendered HTML).

---

## Feature — Reset Data (per-module, platform panel) ✓ COMPLETE (2026-08-28)

Follow-up to Delete Association — user wanted a lighter-weight option: clear specific *content*
(events, news, members, dues, etc.) from an association per their own selection, while keeping the
association itself, its domain/branding/settings, and admin logins intact. Built alongside Delete
Association on the same platform detail page ("Reset Data" section, amber, vs. "Danger Zone" red).

- **`POST /api/platform/associations/[id]/reset`**: takes `{ modules: string[], confirmSlug }` — same
  server-side slug-match confirmation as Delete Association. 12 independently-selectable modules:
  Members, Applications, Events, News, Committee, Timeline, Meetings, Tasks, Dues & Payments,
  Financial Ledger, Activity Log, Portal Accounts. Deliberately excludes Designations/Settings/
  AdminUsers — those are configuration/access, not content, and clearing them would risk locking the
  admin out of their own account.
- **`members` module is the tricky one** — `Member` is never deleted directly (shared multi-tenant
  entity, same rule as Delete Association). It unlinks `MemberAssociation` for this association, then
  deletes any `Member` row left with **zero remaining references anywhere** — checked across
  `MemberAssociation`, `CommitteeMember.memberId`, and `MembershipApplication.memberId` (the only two
  non-cascading FKs to Member, per the cascade map in [[database-patterns]]). A member still linked to
  another association, or still referenced by a `CommitteeMember`/`MembershipApplication` row the admin
  chose NOT to clear this run, survives untouched. This handler always runs **last** among selected
  modules in execution order, so it naturally sees the post-deletion state of everything else picked
  in the same request.
- **`financial` module ordering**: `JournalEntry`/`Expense` reference `FinancialAccount`/
  `ExpenseVendor` without a cascade, so those go first, then `FinancialYear`/`FinancialAccount`.
- **Verified end-to-end** on a second disposable test association (never a real one): (1) selective
  test — reset only `news`+`activity`, confirmed those went to zero while `TimelineEntry`, `AdminUser`,
  and `SiteSettings` were completely untouched; (2) the members orphan-safety test — created one
  "orphan" member (no other references) and one "referenced" member (linked to a `CommitteeMember` row
  deliberately NOT selected for clearing), ran `members`-only reset, confirmed the orphan was fully
  deleted, the referenced member survived, and the kept `CommitteeMember` row was untouched. Cleaned up
  all test data afterward (deleted the test association + the one orphan-safety Member row that Delete
  Association doesn't touch by design) — final state confirmed as only the 3 real associations, zero
  leftover test rows anywhere.

---

## Fix — Admin sidebar showed wrong association's branding ✓ COMPLETE (2026-08-28)

Found by user testing locally: logged into `namoAdmin` (Namo Udyam), sidebar showed EVA Nepal's logo
and name. Root cause: `/api/admin/branding` always resolved the association via hostname →
`DEV_ASSOCIATION_SLUG` fallback, completely ignoring which admin was actually logged in — in local dev,
every admin session sees whichever association the env var points to, regardless of their real
association. Not a practical issue in production (each association has its own real domain, so
hostname resolution happens to be correct there), but broke local multi-tenant testing entirely and was
a latent correctness bug in an admin-scoped endpoint that should never have depended on hostname in the
first place. Fixed by having `/api/admin/branding` prefer `getAdminContext().associationId` first,
falling back to the old hostname/dev-slug logic only if there's no admin session (shouldn't normally
happen on an admin-only route). Checked for the same pattern elsewhere — isolated to this one route;
`opengraph-image.tsx`, `app/api/manifest/route.ts`, and `lib/getAssociation.ts` are genuinely
public/hostname-scoped and correctly don't use admin context. Verified via `npx tsc --noEmit` (clean)
and curl (`/api/admin/branding` now returns the right association per session).

---

## Feature — Separate PWA manifests for Admin/Portal/Public/Platform ✓ COMPLETE (2026-08-28)

Previously all 4 surfaces (public site, admin panel, member portal, platform panel) shared one
manifest (`/api/manifest`, linked from the single root `app/layout.tsx`) — installing "Add to Home
Screen" from any of them produced the same icon/name/start_url, so users couldn't distinguish
installed apps for different surfaces on their home screen.

- **Refactor**: `admin/layout.tsx`, `portal/layout.tsx`, `platform/layout.tsx` were all `"use client"`
  (hooks-heavy sidebar/session logic), and Next.js metadata exports require a Server Component. Split
  each into a thin server `layout.tsx` (exports `metadata: { manifest: "..." }`, renders the shell) +
  the original client logic relocated verbatim into `components/admin/AdminShell.tsx`,
  `components/portal/PortalShell.tsx`, `components/platform/PlatformShell.tsx` (pure move + rename,
  no behavior change — one relative import fixed: `../admin.css` → `@/app/(admin)/admin.css`).
- **4 manifest routes**: `/api/manifest` (public, unchanged), `/api/manifest/admin` (new — name
  `"{Association} Admin"`, `start_url: "/admin/dashboard"`, `scope: "/admin"`, prefers the logged-in
  admin's own association via `getAdminContext()` before falling back to hostname/`DEV_ASSOCIATION_SLUG`
  resolution — same reasoning as the branding-route fix above), `/api/manifest/portal` (new — name
  `"{Association} Portal"`, `start_url: "/portal"`, `scope: "/portal"`, hostname-resolved like the
  public one since portal has no admin session), `/api/manifest/platform` (new — **not** per-association;
  Nibjar's own fixed identity, icon = `/nibjar/nibjar_purple_logo.png`, `start_url: "/platform/dashboard"`).
- **Design decision (confirmed with user)**: Admin/Portal/Public all use the *same* association logo —
  differentiation between installed icons comes from each having a different `start_url`/name/scope, not
  different artwork. No new icon assets were created for this feature.
- Verified via `npx tsc --noEmit` (clean) and curl against the live dev server (didn't run `npm run build`
  — two earlier `.next` cache collisions with the live dev server this session, see notes below): all 4
  manifest endpoints return correct distinct JSON, all 4 surfaces' rendered HTML `<link rel="manifest">`
  points at the right one, and a 7-route error-marker sweep came back clean.

---

## Fix — POST /api/members crashed on every new member creation ✓ COMPLETE (2026-08-28)

Found by user while testing the new person-mode form: `Unknown argument showPhone` — a Prisma error
crashing `Member.create()`. Root cause was pre-existing and affected BOTH venue and person mode, not
something the new form introduced: `PUT /api/members/[id]` (edit) already correctly separated
`showPhone`/`showEmail` from the body and routed them to `MemberAssociation.update` (those fields live
there, not on `Member`), but `POST /api/members` (create) only ever stripped `memberCategoryId`/
`billingOption` before calling `Member.create()` — `showPhone`/`showEmail` stayed in the payload and
crashed every time, since both `MemberForm.tsx` and the new `PersonMemberForm.tsx` always send those
two keys regardless of mode. Fixed by mirroring `PUT`'s pattern in `POST`: strip both fields out of
`memberData` and pass them into the `MemberAssociation.create()` call instead. Verified end-to-end via
curl (created a test member with the flags in the payload → confirmed they landed on the correct
`MemberAssociation` row, not rejected → cleaned up test record) and `npx tsc --noEmit` + `npm run build`
(clean).

---

## Feature — Person-mode Member form + Committee Member↔Member linking ✓ COMPLETE (2026-08-28)

Follow-up to the fix above, discussed and confirmed with user before building (LAW 1).

- **`components/admin/PersonMemberForm.tsx`** (new component, `MemberForm.tsx` left completely untouched per LAW 2):
  2-step wizard (Basic Info → Contact) for `member_mode = "person"` associations. Reuses the same field-mapping
  convention the public site already established — `category` = profession, `area` = location — no schema change
  needed. Skips every venue-only field (capacity, amenities, geocoords, firm registration, owner/father/grandfather
  name). Same submit target (`/api/members`, `/api/members/[id]`) and validation approach as `MemberForm.tsx`.
  `admin/members/new/page.tsx` and `admin/members/[id]/page.tsx` now fetch `member_mode` server-side and pick which
  form component to render.
- **`CommitteeMember` ↔ `Member` linking**: correction — initial investigation wrongly concluded
  `CommitteeMember.memberId` didn't exist (a truncated `grep -A 20` cut off before that field). It was already in
  the schema *and* migrated to the DB from earlier uncommitted work, but completely unused — no UI or API ever read
  or wrote it. Added a new "Link to an existing member" search-and-pick block at the top of `CommitteeForm.tsx`
  Step 1 (separate from the existing venue-picker in Step 2, which serves a different purpose — "which venue does
  this person represent" — and was left untouched). Picking a member auto-fills name/photo/bio **once**
  (snapshot-at-link-time, confirmed with user) and sets `memberId` in the submitted payload; `POST`/`PUT
  /api/committee` already did full-body pass-through to Prisma, so no API changes were needed. Unlinking only clears
  the reference, doesn't clear already-filled text fields.
- Verified via `npx tsc --noEmit` + `npm run build` (both clean) and curl smoke tests (200s, no error markers, no
  server-log errors) on `/admin/members/new`, an existing member edit page, `/admin/committee/new`, and an existing
  committee-member edit page.
- **Real bug found via user manual testing, fixed same session**: `POST /api/members` crashed on every single new
  member creation (venue OR person mode — pre-existing, not introduced by `PersonMemberForm`) with
  `Unknown argument showPhone`. Root cause: `PUT /api/members/[id]` (edit) already correctly destructured
  `showPhone`/`showEmail` out of the body and routed them to `MemberAssociation.update` (those fields live there,
  not on `Member`), but `POST` never got the same treatment — it only stripped `memberCategoryId`/`billingOption`
  before calling `Member.create()`, leaving `showPhone`/`showEmail` in the data and crashing every time, since both
  `MemberForm.tsx` and `PersonMemberForm.tsx` always send those two keys. Fixed by mirroring `PUT`'s pattern: strip
  both from `memberData` and pass them into the `MemberAssociation.create()` call instead. Verified end-to-end via
  curl (create → confirmed `showPhone`/`showEmail` landed on the right `MemberAssociation` row → cleaned up test
  record) and `npx tsc --noEmit` + `npm run build` (both clean).

---

## Feature — Persistent "email failed" flags across 4 email flows ✓ COMPLETE (2026-08-27)

Discussed with user: instead of trying to prevent every possible bounce (a valid-domain-but-nonexistent
mailbox like `abc@gmail.com` can't be reliably caught without a paid verification API or unreliable SMTP
probing — see PROGRESS.md history/conversation), just make failures visible to the admin where they'd
naturally look, so they know to follow up with the person by another channel.

- Migration `20260827105327_add_email_failure_tracking` — added `emailFailedAt DateTime?` + `emailError String?`
  (both nullable, additive) to 4 models: `Member`, `MembershipApplication`, `MemberAccount`, `TicketRegistration`.
- `lib/emailFailureTracking.ts` — `recordEmailResult(update, error)`: small shared helper, sets both fields on
  failure (with the actual SMTP error message) or clears both to `null` on the next successful send to that
  same address — so a flag doesn't linger forever once the underlying issue is fixed.
- Wired into all 4 send call sites:
  - Ticket buyer confirmation + payment-confirmation emails → flags `TicketRegistration`
  - Membership application applicant confirmation → flags `MembershipApplication`
  - Dues reminder emails → flags `Member` (already had per-member try/catch; just added the persist step)
  - Meeting notify emails → flags `MemberAccount`. This one required a real refactor: it previously sent ONE
    batch email with every portal account's address in the `to:` field (which also meant every recipient
    could see everyone else's email address — fixed as a side effect), now loops and sends one email per
    account so failures can be attributed individually. Response shape changed from `{ sent }` to
    `{ sent, failed }`; admin meetings page "Notify" tab updated to show the failed count.
- Admin UI: small amber warning badge (tooltip = the actual error message) next to the email/name wherever
  it's shown — `EventTicketsClient.tsx` (event Registrations tab), `/admin/applications` (desktop + mobile),
  `/admin/membership/dues` (desktop + mobile), `/admin/portal-accounts`.
- Verified end-to-end: registered a real ticket with correct SMTP creds deliberately broken (`SMTP_PASS`
  override), confirmed `TicketRegistration.emailFailedAt`/`emailError` were set with the real Gmail auth
  error, and confirmed the "⚠ email issue" badge rendered correctly in the admin Registrations tab.

---

## Fix — Ticket registration was completely broken ✓ COMPLETE (2026-08-27)

Found during pre-deploy testing: `app/events/[slug]/TicketSection.tsx` posted
`{ name, email, phone }` to `POST /api/events/[id]/register`, but the route only
ever validated/read `buyerName`/`buyerEmail`/`buyerPhone` — every public ticket
registration failed with "Missing required fields", 100% of the time. Confirmed
via direct curl (server logic itself was correct) vs. actual browser submission
(always 400). Already committed on `dailyWork`, but `production` branch predates
the ticket-sales feature entirely, so it never reached the live site.

Fix: `TicketSection.tsx` now sends `buyerName`/`buyerEmail`/`buyerPhone` to match
the API (and everywhere else in the codebase — admin checkin page, `EventTicketsClient`,
the registrations route — already used those names; only this one call site was wrong).
Verified end-to-end through the real browser UI after rebuild: registration succeeds,
`soldCount` increments atomically, capacity blocking ("Sold out") works.

---

## Fix — Events no longer stay "Upcoming" forever after they pass ✓ COMPLETE (2026-08-27)

`Event.status` was only ever set by `EventForm` (auto-computed from the date field
at save time, or manual override) and never re-derived afterward — an event left
"upcoming" past its date stayed that way on every read path (admin list/dashboard,
public homepage, public events list/detail, portal dashboard/events) until someone
re-opened and re-saved the form. Confirmed via testing: several dev-seeded 2025
events were still showing "Upcoming" in the admin panel, homepage, and portal.

Fix: `lib/eventStatus.ts` — `autoArchivePastEvents(associationId?)`, a small
self-healing helper (two `updateMany` calls: one for events with `endDate` set,
one for open-ended events using `date`) that flips `"upcoming"` → `"past"` once
an event is more than **1 day** past its end (or start, if no end date) — a grace
period so an event doesn't flip mid-day and admins can still amend it same-day.
Only ever touches rows currently `"upcoming"`; never touches `"past"` rows an
admin already set.

Wired into every read path that displays event status, called before the query:
`app/page.tsx`, `app/events/page.tsx`, `app/events/[slug]/page.tsx`,
`app/(admin)/admin/events/page.tsx`, `app/(admin)/admin/dashboard/page.tsx`,
`app/api/events/route.ts` (GET), `app/api/portal/events/route.ts` (GET) —
covers both portal pages, which fetch via that API route rather than querying
Prisma directly in the server component.

Verified with a synthetic test: event 30 days out → stays upcoming; event 12h in
the past (within grace) → stays upcoming; event 2 days in the past → flips to past.

---

## Fix — Mailer now filters placeholder/test email addresses ✓ COMPLETE (2026-08-27)

Testing sent real emails (via the association's live Gmail SMTP) to obviously-fake
test addresses (`qa-test@example.com`), which bounced back "Address not found" to
the sending inbox. Root cause: `sendMail()` had no concept of an unsendable address.

Fix: `lib/mailer.ts` — filters recipients against RFC 2606 reserved domains
(`example.com/.net/.org/.edu`, common placeholders like `test.com`, `sample.com`,
`domain.com`, `yourdomain.com`, `email.com`) and reserved TLD suffixes
(`.test`, `.invalid`, `.example`, `.localhost`) before calling the transporter.
Malformed addresses (no `@domain`) are also treated as unsendable. If every
recipient in a call gets filtered out, the send is skipped entirely (logged,
not thrown) rather than attempting delivery. Centralized in the single
`sendMail()` funnel, so it protects every call site (membership applications,
dues reminders, meeting notifications, ticket confirmations, etc.) without
touching any of them individually.

Verified: an all-placeholder recipient list is skipped before any network call;
a real-looking address still reaches the actual send attempt (confirmed via a
deliberate bad-auth error, proving the code path wasn't short-circuited).

---

## Fix — Meeting notify email no longer crashes on send failure ✓ COMPLETE (2026-08-27)

Found while auditing all `sendMail()` call sites for graceful-failure handling (discussed with user: bounces to
addresses with a valid domain but nonexistent mailbox — e.g. `abc@gmail.com` — are normal and not worth
programmatically preventing; decided to just make sure failures never crash a request instead). Every other
call site was already fire-and-forget (`.catch(console.error)`) or wrapped in try/catch (`dues/remind` loops
per-member) — `app/api/meetings/[id]/notify/route.ts` was the one exception, calling `await sendMail(...)`
directly. A rejected send there would have thrown an unhandled error and returned a generic 500 instead of
the app's standard `{ success, error }` shape. Now wrapped in try/catch, returns a clean formatted error.

---

## Fix — Platform "Create Association" now bootstraps an admin login ✓ COMPLETE (2026-08-27)

Gap found while preparing to add a new association ("Namoudyam"): `POST /api/platform/associations`
created the Association + designations + financial year/accounts, but never created an `AdminUser` —
the only admin logins that ever existed were hardcoded in `prisma/seed.ts` for EVA Nepal/Bhaktapur.
A newly-created association had no way to log into `/admin`.

- `app/api/platform/associations/route.ts` — POST now requires `adminName`, `adminEmail`,
  `adminPassword` in the body; validates presence + 8-char min password + email not already in use
  (`AdminUser.email` is globally unique); creates the `AdminUser` (`systemRole: "admin"`,
  bcrypt-hashed password, `designationId: null` — `systemRole === "admin"` already bypasses all
  permission checks, see `lib/permissions.ts hasPermission()`) inside the same `$transaction` as the
  association, designations, financial year, and accounts
- `app/(platform)/platform/associations/new/page.tsx` — added an "Initial Admin Login" section
  (name/email/password, all required) to the create form
- Also added a **Member Mode** select (`venue` | `person`) to the same form — previously hardcoded
  to `"venue"` in the API; now `body.memberMode` seeds the `member_mode` SiteSettings row (validated
  server-side to be `"venue"` or `"person"`, defaults to `"venue"` if omitted for API back-compat).
  Still editable later via `/admin/settings` either way.
- Purely additive — existing associations and their admin users are untouched; only the create flow changed

---

---

## Phase A — Roles + Permissions ✓ COMPLETE (2026-08-26)

Schema: `Designation` model added (per-association role definitions). `AdminUser` extended with `systemRole`, `designationId`, `extraPermissions[]`, `deletedAt` (soft delete). `MemberAssociation.designationId` added (for Phase B).
Migration: `20260826115713_add_designation_role_system`

Lib:
- `lib/permissions.ts` — `PERMISSION_KEYS`, `PERMISSION_LABELS`, `DEFAULT_DESIGNATIONS`, `hasPermission()`, `mergePermissions()`
- `lib/adminAuth.ts` — updated to return `{ session, associationId, adminId, systemRole, permissions }` (fresh DB fetch per request, soft-delete check)
- `lib/auth.ts` — added `systemRole` to JWT

API (new):
- `GET/POST /api/designations` — list + create designations (admin only)
- `PUT/DELETE /api/designations/[id]` — update + delete designations (admin only)

API (updated):
- `GET/PUT /api/users` — returns `systemRole` + `designation`; POST includes systemRole/designationId
- `PATCH/DELETE /api/users/[id]` — PATCH updates role/designation/password; DELETE does soft delete; last-admin guard on both
- Permission checks added to: POST /api/members (`members.create`), POST /api/events (`events.manage`), POST /api/news (`news.manage`), POST /api/meetings (`meetings.manage`), GET+POST /api/membership/dues (`finances.view`/`finances.edit`), GET /api/admin/reports (`reports.view`), PUT /api/settings (`settings.manage`)
- `/api/platform/associations` POST — seeds 6 default designations on new association creation

Admin pages (new):
- `/admin/designations` — full CRUD (list with permission chips, create/edit modal with permission checkboxes, delete with guard)

Admin pages (updated):
- `/admin/users` — shows systemRole + designation; create/edit modals with role + designation selectors; soft delete
- `/admin/layout` — sidebar is role-aware (hides adminOnly items for editor/member users); Designations link added to System group

---

## Phase H — Dues Reminder Emails + Meeting Bulk Attendance + Portal Dashboard Enhancements ✓ COMPLETE (2026-08-27)

Dues Reminder Emails:
- `app/api/membership/dues/remind/route.ts` — POST endpoint; queries all pending/partial dues; groups by member email; sends styled HTML reminder email per member via `sendMail()`; returns `{ sent, skipped, errors? }`
- `app/(admin)/admin/membership/dues/page.tsx` — "Send Reminders" button (amber, Bell icon) next to "Record Payment"; reminder modal with optional custom message textarea; shows success/error toast after send

Meeting Bulk Attendance from RSVPs:
- `app/api/meetings/[id]/attendance/bulk/route.ts` — POST endpoint; fetches all RSVPs with `status="attending"`; upserts MeetingAttendance for each (skips already-marked); returns `{ created, total }`
- `app/(admin)/admin/meetings/[id]/page.tsx` — "Mark RSVPs Present" button in attendance tab header (only shown when meeting has RSVPs); calls bulk endpoint + reloads meeting data

Portal Dashboard Attendance Stats:
- `app/(portal)/portal/page.tsx` — added 4th stat card "Meetings Attended" (X / Y format, UserCheck icon); grid is now 2×2 on mobile, 4 columns on sm+; attendance count derived from `meeting.attended` (already returned by `/api/portal/meetings`)

---

## Phase G — CSV Export + Portal Meeting Enhancements ✓ COMPLETE (2026-08-27)

CSV Export:
- `app/(admin)/admin/members/MembersClient.tsx` — "Export CSV" button (client-side, from filtered+sorted rows); downloads `members-YYYY-MM-DD.csv` with 10 columns
- `app/api/membership/dues/export/route.ts` — new GET route; streams dues CSV with member name/area/category/period/amounts/status; `Content-Disposition: attachment` header
- Reports page Finances tab — "Export Dues CSV" download link pointing to `/api/membership/dues/export`

Portal Meeting Enhancements (Phase C schema integration):
- `app/api/portal/meetings/route.ts` — added `agendaItems.resolved` + `agendaItems.outcome` + `minutes.contentNe` to query; added `MeetingAttendance` lookup to return `attended: boolean` per meeting
- `app/(portal)/portal/meetings/page.tsx` — resolved checkmarks on agenda items (strikethrough + ✓ icon + outcome chip); "You were present" badge on attended past meetings; EN/NE toggle button on minutes panel when Nepali content exists

---

## Phase F — Reports Ledger Integration + Dashboard Financial Stats ✓ COMPLETE (2026-08-27)

Reports API (`/api/admin/reports`):
- Added journal entry aggregation: `ledgerByMonth` (income vs expense), `ledgerByIncomeAccount`, `ledgerByExpenseAccount`
- Added active FinancialYear lookup + `openingBalance` + `ledgerNetBalance` computation
- Journal entries added to `availableYears` year-filter logic

Reports UI (`/admin/reports/page.tsx`):
- Added "Ledger" tab (5th tab, `Landmark` icon) between Finances and Attendance
- Ledger tab: net balance stat cards, monthly cash flow dual-bar chart (income green / expense red), income by account breakdown, expense by account breakdown

Dashboard (`/admin/dashboard/page.tsx` + `DashboardClient.tsx`):
- Added `ledgerSummary` server-side query (active year → income/expense totals → net balance)
- Added 3-card financial row (Income / Expenses / Net Balance) linking to `/admin/finances` — only shown when an active financial year exists

---

## Phase E — Portal Upgrades + Scroll Pagination ✓ COMPLETE (2026-08-27)

Portal:
- `app/(portal)/portal/layout.tsx` — full overhaul: mobile hamburger sidebar, dynamic association branding (logo + name), member name + initials in footer, pending dues badge on "My Dues" nav link, "Profile" nav link added
- `app/(portal)/portal/profile/page.tsx` — new profile page: view read-only member info (name, area, category, memberSince); edit phones[] + email; PUT /api/portal/me saves changes
- `app/api/portal/me/route.ts` — added PUT method (update phones + email); GET extended to return category + memberSince

Admin:
- `app/(admin)/admin/members/MembersClient.tsx` — replaced prev/next page buttons with IntersectionObserver infinite scroll (sentinel div at bottom auto-advances page as user scrolls); status bar shows "X of Y members · scroll for more"

Public:
- `app/members/MembersClient.tsx` — added "Load More" button (shows 24 at a time); filter/area changes reset visible count; button shows remaining count

---

## Phase D — Financial Ledger ✓ COMPLETE (2026-08-27)

Schema: `FinancialYear`, `FinancialAccount`, `JournalEntry` models added to Association.
Migration: `20260827015825_add_financial_ledger`

Lib:
- `lib/autoJournal.ts` — `autoJournal()`, `cashAccountCode()`, `journalForExpense()`, `journalForDues()`, `journalForContribution()`, `journalForTicket()` — fire-and-forget helpers wired into all payment flows

API (new):
- `GET/POST /api/finances/years` — list + create financial years
- `PUT/DELETE /api/finances/years/[id]` — update/close year (activity-logged), delete (blocked if entries exist)
- `GET/POST /api/finances/accounts` — list with usage counts + create (unique code, valid type)
- `PUT/DELETE /api/finances/accounts/[id]` — update name/order, delete (blocked for defaults or used accounts)
- `GET/POST /api/finances/journal` — list with yearId/type filters (up to 500), manual entry with full validation + activity log
- `PUT/DELETE /api/finances/journal/[id]` — edit with before/after audit log, delete with audit log

API (updated):
- `POST /api/platform/associations` — seeds FinancialYear (current calendar year) + 10 default FinancialAccounts on new association creation
- `POST /api/meetings/[id]/expenses` — wired `journalForExpense()`
- `PUT /api/membership/dues/[id]` — wired `journalForDues()` when becoming paid/partial
- `PUT /api/meetings/[id]/contributions/[contribId]` — wired `journalForContribution()` on paid status
- `POST /api/events/[id]/registrations/[regId]` — wired `journalForTicket()` on confirm_payment action

Admin pages (new):
- `/admin/finances` — full Financial Ledger UI with 4 tabs:
  - **Ledger**: running balance table with in/out/balance columns, manual entry form, year selector
  - **Summary**: income/expense breakdown grouped by account name
  - **Years**: create/close financial years with confirmation
  - **Accounts**: grouped by type (asset/income/expense/liability), add custom account form
- Admin sidebar: "Ledger" link (`Landmark` icon) added to Financials group, first in list

---

## Phase C — Meeting Enhancements ✓ COMPLETE (2026-08-27)

Schema: `AgendaItem.resolved Boolean @default(false)`, `MeetingMinutes.contentNe String?`, `MeetingAttendance` model added.
Migration: `20260827014000_add_phase_c_meeting_enhancements` (approximate)

Admin pages (updated):
- `/admin/meetings/[id]` — full rewrite with 6 tabs: agenda (with resolve toggle + outcome editor), attendance (member checklist, search, click-to-toggle), expenses, contributions, minutes (EN + NE + AI translate, publish/unpublish), notify (meeting_notice / minutes_published types, send button)
- `/admin/meetings/page.tsx` + `MeetingsListClient.tsx` — added attendanceCount column

Public pages (updated):
- `/meetings` (`MeetingsPublicClient.tsx`) — year filter chips, resolved checkmark indicators on agenda items, EN/NE language toggle on minutes when Nepali content exists

---

## Phase B — Member Generalization ✓ COMPLETE (2026-08-26)

Schema: `Member.phones String[]` added (legacy `phone String?` kept). `MemberAssociation.showPhone/showEmail Boolean @default(false)` added. `CommitteeMember.memberId String?` FK to Member added. `MemberGroup` + `MemberGroupLink` models added (per-association groups). `member_mode` SiteSettings key seeded for all associations.
Migration: `20260826123225_add_member_generalization`

Types: `lib/types.ts` — `MemberType.phones String[]`, `email` now visible (was hidden).

API (updated):
- `GET /api/members/[id]` — returns `showPhone` + `showEmail` flattened from MemberAssociation
- `PUT /api/members/[id]` — accepts `showPhone` + `showEmail`, updates MemberAssociation; strips before Member update
- `POST /api/platform/associations` — seeds `member_mode = "venue"` SiteSettings on new association creation

Public pages (updated):
- `app/members/page.tsx` — queries `showPhone`/`showEmail` from MemberAssociation; resolves `phones[]`; passes `memberMode` to MembersClient
- `app/members/[slug]/page.tsx` — queries `showPhone`/`showEmail`; resolves `phones[]`; respects visibility flags on phone/email display
- `app/page.tsx` — maps `memberMode`; hides phones/email on homepage (no showPhone context); passes `memberMode` to StatsSection
- `MembersClient.tsx` — accepts + passes `memberMode`; mode-aware empty/count labels
- `MemberCard.tsx` — accepts `memberMode`; person mode hides capacity bar/tier; uses `phones[]` array
- `StatsSection.tsx` — accepts `memberMode`; changes "Member Venues" → "Members" label in person mode

Admin pages (updated):
- `components/admin/MemberForm.tsx` — initializes phones from `phones[]` array (falls back to `phone` string); submits both `phones[]` + `phone` string; accepts `showPhone`/`showEmail` props; shows visibility toggles in Step 4 (edit mode only)
- `app/(admin)/admin/members/[id]/page.tsx` — fetches `showPhone`/`showEmail` from MemberAssociation; passes to MemberForm
- `app/(admin)/admin/settings/page.tsx` — added "General" tab (first tab, default); `member_mode` rendered as dropdown select

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

## Phase 5 — Event Ticket Sales ✓ COMPLETE

Built under different model names than originally planned below, but scope is fully covered:

- `TicketType` (event FK, name, price, memberPrice, totalCapacity, strictCapacity, soldCount, order, active) — `prisma/schema.prisma`
- `TicketRegistration` (ticketType FK, buyerName/Email/Phone, quantity, paymentStatus, amount, paymentMethod, receiptNumber, checkInToken, checkedIn/checkedInAt/checkedInBy, cancel/refund fields) — replaces the originally-planned separate `TicketPurchase` + `EventAttendance` models; check-in is tracked directly on the registration row instead of a separate attendance table
- Public: `app/events/[slug]/TicketSection.tsx` + `POST /api/events/[id]/register` — atomic `soldCount` increment inside a transaction (re-fetches capacity to prevent oversell race conditions), returns `checkInToken`
- Admin: `/admin/events/[id]` "Tickets & Registrations" tab (`EventTicketsClient.tsx`) — ticket type management + registration list + check-in; `PATCH /api/events/[id]/registrations/[regId]` for status/check-in/payment updates
- Cross-module wiring verified: ticket sold → `soldCount` increments + `TicketRegistration` created (same transaction) → `ticketRegistration.amount` aggregated into `/api/admin/reports` (`totalTicketRevenue`) → visible in reporting dashboard

No remaining code work here. (Original plan below kept for reference only.)

<details>
<summary>Original plan (superseded)</summary>

- [x] Discuss pricing model and flow before any code
- [x] TicketType model (event FK, name, price, totalCapacity, soldCount)
- [x] Buyer/payment tracking — via `TicketRegistration` instead of a separate `TicketPurchase` model
- [x] Check-in tracking — via fields on `TicketRegistration` instead of a separate `EventAttendance` model
- [x] Public: event detail page shows ticket types + purchase flow
- [x] Admin: ticket type management + attendee list + check-in (tab on `/admin/events/[id]`, not a separate `/tickets` route)
- [x] Event revenue — aggregated into `/admin/reports`, not a separate `/admin/events/[id]/revenue` page
- [x] Cross-module wiring (soldCount increment, registration record, check-in, dashboard revenue)
- [x] progress.md + system_snapshot.md updated

</details>

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

## Feature 6 — AI Content Generation ✓ COMPLETE

Built: /api/ai/generate POST endpoint using @anthropic-ai/sdk + claude-opus-4-6.
Three generation types: "bio" (committee bio), "news" (excerpt + full content), "agenda" (5–7 meeting agenda items).
AI buttons wired into: CommitteeForm Step 3 ("Generate Bio"), NewsForm Step 2 ("Generate with AI"), Meetings detail page Agenda tab ("Suggest with AI").
Agenda suggestions shown as a dismissable panel — each item has a + button to add directly to the meeting.

---

## Feature 7 — Reports Charts + Tabs ✓ COMPLETE

Rebuilt /admin/reports as a 4-tab layout: Overview / Finances / Attendance / Members.
Replaced thin progress bars with proper vertical CSS bar charts (no external libs).
DuesBarChart: stacked vertical bars (paid green + pending amber), h-36 container with flex items-end.
MemberGrowthChart: single indigo vertical bars.
AnimatePresence tab transitions (fade in/out). StatCard, SectionHeader, Empty, HBar helper components.

---

## Feature 8 — Election System + Committee History ✓ COMPLETE

### Schema
- Migration: add_term_fields_to_committee_member
- Added to CommitteeMember: active Boolean @default(true), termYearAD Int?, termMonthAD Int?, termYearBS Int?, termMonthBS Int?

### API
- GET /api/committee — now filters active: true (current only)
- POST /api/committee/archive — archives all active members with BS+AD term year/month stamp
- GET /api/committee/history — returns archived members grouped by BS term year

### Admin
- /admin/committee — shows only active=true members; "Archive Committee" button (Framer Motion modal, BS+AD year+month pickers); "Past Committees" link
- /admin/committee/history — grouped by BS term year with AD year badges; full member tables per term
- CommitteeForm Step 2 — added optional "Election / Term Year" section (BS + AD year + month)

### Public
- /committee/history — public history page; navy header; terms grouped by BS year; office bearers grid + executive members grid; member photo cards

### Data
- Seeded 28 archived committee members across 3 past terms: 2076/2019, 2078/2021, 2080/2023 B.S./A.D.
- Removed 105 duplicate EVA Nepal venue members (156 → 51 clean links); scripts: prisma/seed-committee-history.ts, prisma/dedup-eva-members.ts

---

## Feature — Timeline Admin ✓ COMPLETE (undocumented until 2026-08-27 audit; code already existed)

- `/admin/timeline` — full CRUD (`TimelineClient.tsx`, list + create/edit modal + delete confirmation), ordered by `order` then `year`
- `GET/POST /api/timeline` + `PUT/DELETE /api/timeline/[id]` — scoped by `associationId`
- Public `/` homepage Timeline section already read from DB (seeded 9 entries per association)
- Sidebar link (Clock icon) under Content group in `/admin/layout`

---

## Feature 9 — Dynamic OG Image ✓ COMPLETE (2026-08-27)

- `app/opengraph-image.tsx` — Next.js special file, generates the `og:image` (1200×630 PNG) via `next/og` `ImageResponse` at request time instead of a static file
- Resolves the current association by hostname directly (mirrors the safe pattern in `/api/admin/branding` — does NOT use the `getAssociation()` `React.cache()` helper, since this file compiles to a route handler outside the render tree and would risk the same cross-request cache leak documented for API routes)
- Reads the association's real logo (from `/public`, base64-embedded), name, and description at render time — navy/gold brand colors — so every association gets a correct branded share image with no manual asset upload needed
- Verified locally: `GET /opengraph-image` → 200, `image/png`, renders correctly (tested via local dev server on an unused port, not deployed)
- Resolves the "Add og-image.jpg" item from Known Pending Items — no static file was added; codebase-wide search confirmed no other pending og-image reference

---

## Fix — Stuck-Loading-Spinner Bug Class ✓ COMPLETE (2026-08-29)

Audited the codebase for a bug pattern found while fixing the Activity Log page: client components that call `fetch()` inside `useEffect` with no `try/catch` around the fetch+`.json()` parse. If the request fails (network error, 5xx, non-JSON response), `setLoading(false)` never runs and the page shows a loading spinner forever with no way to recover except a full page reload.

Fixed 11 instances, all using the same pattern — `error`/`loadError` state, `try { ...; if (!json.success) throw new Error() } catch { setError(...) } finally { setLoading(false) }`, and an error-state UI block (icon + message + "Try again" button that re-runs the load function) rendered between the loading and success states:

- `app/(admin)/admin/activity/page.tsx` — also added per-entity-type icons, relative `timeAgo()` formatting, manual refresh button, "…" placeholder instead of misleading "0 entries" while loading
- `app/(admin)/admin/reports/page.tsx`
- `app/(admin)/admin/tasks/page.tsx`
- `app/(admin)/admin/membership/categories/page.tsx`
- `app/(admin)/admin/membership/fees/page.tsx`
- `app/(admin)/admin/membership/dues/page.tsx` — two fetch functions wrapped (`loadInit()`, `loadPayments()`)
- `app/(admin)/admin/portal-accounts/page.tsx`
- `app/(admin)/admin/applications/page.tsx` — converted inline `useEffect` fetch into a named, retryable `loadApplications()` function
- `app/(portal)/portal/dues/page.tsx`
- `app/(portal)/portal/events/page.tsx`
- `app/(portal)/portal/meetings/page.tsx`
- `app/(portal)/portal/page.tsx` (member dashboard) — this one had **no loading state at all** (silently showed an empty dashboard forever on fetch failure, not even a stuck spinner); added `loading`/`loadError` state from scratch around its `Promise.all([...])` of 4 fetches

`app/(portal)/portal/profile/page.tsx` already had a `.catch(() => setLoading(false))` — safe from the stuck-forever bug, left as-is (lower-priority UX gap: silent failure with no retry, not fixed this pass).

Verified: `npx tsc --noEmit` clean, dev server smoke-tested (routes resolve without 500s).

**Takeaway for future work**: any new client component with `useEffect(() => { fetch(...) }, [])` must wrap the fetch in try/catch/finally with this same pattern — check for this whenever adding a new admin/portal list or dashboard page.

---

## Feature — Per-Association Color Preset Theming ✓ COMPLETE (2026-08-30)

Each association can now pick one of 6 curated color combinations for their public site + member portal, instead of every tenant sharing the same hardcoded navy/gold. Deliberately NOT a free-form color picker — bad picks would make some association's site look worse, which is the opposite of the goal.

- **Schema**: `Association.colorPreset String @default("navy-gold")` (migration `20260830061702_add_color_preset_to_association`). The pre-existing `themeColor`/`accentColor` fields are kept as synced mirrors (written alongside `colorPreset` on every save) so the 3 PWA manifest routes and the viewport `theme-color` meta tag keep working with zero code changes.
- **Preset registry** (`lib/theme-presets.ts`): 10 presets — Navy & Gold (default, unchanged), Emerald & Amber, Burgundy & Champagne, Charcoal & Copper, Royal Blue & Oxblood, Plum & Terracotta, plus 4 added 2026-08-30 (Saffron & Forest — matched to a submitted association logo's orange/green colors; Onyx & Platinum, Deep Teal & Rose Gold, Espresso & Gold — added for a more premium register). Each preset has a full 11-step primary ramp + 10-step accent ramp mirroring the original navy/gold shade shape. No other code needed to change to add these — the admin picker and API validation both read the registry dynamically.
- **Depth recalibration (same day, after live user feedback)**: the first pass built primary ramps from Tailwind's stock palette families directly, which looked flat and "not premium" on the live site — user-supplied screenshots showed section backgrounds (Mission, Stats) rendering as bright, saturated solid-color panels instead of navy's moody near-black depth. Root cause, confirmed numerically: Tailwind's stock "900" shades sit around L≈30-33% lightness, while the original navy-900 is L≈9.8% — over 3x brighter, which is why every non-default preset's large background sections read as a flat mid-tone block rather than a rich dark. Fix: every colorful primary ramp (Emerald, Burgundy, Royal Blue, Plum, Saffron-Forest, Teal) was regenerated from navy's own measured HSL lightness/saturation curve (700≈19%L, 800≈14.5%L, 900≈9.8%L, 950≈5.7%L, ~73-79% saturation throughout) applied at each preset's hue — same depth and richness as navy, different color. The 3 neutral-based primaries (Charcoal/zinc, Onyx/slate, Espresso/stone) were already naturally dark enough and left unchanged. Also swapped "Royal Blue & Coral"'s red accent for a muted oxblood — pure red reads as an alarm/urgent UI color regardless of what it's paired with, which fights a premium/institutional tone; renamed to "Royal Blue & Oxblood". Re-verified live via the same temporary-DB-write method (Royal Blue & Oxblood and Saffron & Forest rendered via `opengraph-image`, confirmed visibly deep/rich, not flat) and a full `npm run build` pass.
- **Theming mechanism**: `tailwind.config.ts`'s navy/gold colors now resolve via `rgb(var(--navy-900) / <alpha-value>)` (Tailwind's documented CSS-variable technique) instead of literal hex. `app/globals.css` defines the 21 default CSS vars using the exact original hex values converted to RGB triples — numerically identical output for any association still on the default preset. `app/layout.tsx` applies a non-default preset as an inline `style` attribute directly on `<html>` (not a `<style>` tag — inline style specificity can't be out-cascaded regardless of where Next.js injects the stylesheet, avoiding a document-order risk that would otherwise be silent and hard to catch).
- **Non-Tailwind color usage** converted to the same CSS vars: `globals.css`'s ~15 raw-hex gradient/shadow rules, and inline-style gradients in `Mission.tsx`, `StatsSection.tsx`, `Timeline.tsx`, `Contact.tsx`, `MemberDirectory.tsx`, `MemberCard.tsx` (only the brand-colored "Grand" tier — the other 3 capacity tiers keep their own fixed, non-brand hues on purpose). `MemberCard.tsx`'s hex-alpha-suffix trick (`${hex}18`) was replaced with `color-mix(in srgb, ${color} 9%, transparent)` since it doesn't work when the color is a CSS `var()` reference.
- **`app/opengraph-image.tsx`** is the one exception: renders via `next/og`'s Satori engine, not a real browser, so CSS custom properties aren't reliably supported there — it resolves the preset's literal hex server-side instead.
- **Member portal**: portal shares the same root `<html>` shell so it inherits theming automatically; fixed the last handful of literal `bg-[#0a1040]` Tailwind arbitrary-value classes in `PortalShell.tsx` and the "Try again" retry buttons (from the stuck-loading-spinner fix above) to proper `bg-navy-800` classes.
- **API**: `PUT /api/admin/branding` (extends the existing GET-only route) — validates the preset key against the registry, updates `colorPreset` + mirrored `themeColor`/`accentColor` in one write. Permission-gated the same way as `/api/settings`.
- **Admin UI**: new "Branding" tab in `/admin/settings` — a grid of clickable preset swatch cards (split-color chip + name, active-selection ring) instead of the page's usual key/value text-input rows, since this is an `Association`-model field, not a `SiteSettings` KV row.
- **Scope**: public site + member portal only, by design — admin panel and the platform operator panel keep their own fixed identity (platform's indigo theme is intentional, signals "internal tool" per the earlier visual-overhaul checkpoint plan).

Verified: `npx tsc --noEmit` clean throughout. End-to-end tested via direct DB writes (temporary, reverted after): confirmed a non-default preset (Royal Blue & Coral) correctly themed the homepage, portal login page, `theme-color` meta tag, `/api/manifest` response, and `opengraph-image` — then confirmed reverting to the default preset produces **zero** `style` attribute on `<html>` (byte-identical output to before this feature existed).

**Takeaway for future work**: any new brand-colored gradient/shadow (inline `style` or raw hex) must use `rgb(var(--navy-N) / alpha)` / `rgb(var(--gold-N) / alpha)`, never literal hex — otherwise it silently won't respond to preset switching. Admin panel and platform panel are intentionally excluded from this system; don't theme them without a fresh discussion.

---

## Pending (real-world content, not code)

Superseded by the consolidated "Known Pending Items" section near the top of this file (re-verified 2026-08-27) — see there instead of this stale duplicate.

---
