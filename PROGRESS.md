# EVA Nepal Website — Build Progress

## What Is This Project
Full public-facing website for the **Event and Venue Association Nepal (EVA Nepal)**, an official industry body for event venues in Kathmandu, founded 2011. The site serves as the primary digital presence: member directory, events calendar, news, association history, and membership applications.

---

## Tech Stack
| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router) | Static + client hybrid, great SEO |
| Language | TypeScript (strict) | Type safety throughout |
| Styling | TailwindCSS 3 | Utility-first, custom design tokens |
| Animations | Framer Motion 11 | Scroll effects, layout animations |
| Icons | lucide-react | Consistent icon set |
| Fonts | next/font/google | Inter (sans) + Playfair Display (serif), no layout shift |

---

## File System

```
project-root/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage (all sections composed here)
│   ├── globals.css               # Tailwind + full design-system utilities
│   ├── not-found.tsx             # 404 page
│   ├── sitemap.ts                # Auto-generated sitemap.xml
│   ├── robots.ts                 # robots.txt
│   ├── members/
│   │   ├── page.tsx              # Full member directory (client)
│   │   └── [slug]/page.tsx       # Individual member profile (static, 155 pages)
│   ├── events/
│   │   └── page.tsx              # Events list (client)
│   └── news/
│       ├── page.tsx              # News list (client)
│       └── [slug]/page.tsx       # Individual article (static, 6 pages)
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx            # Site-wide navigation
│   │   └── Footer.tsx            # Site-wide footer
│   ├── sections/                 # Homepage section components
│   │   ├── Hero.tsx
│   │   ├── StatsSection.tsx
│   │   ├── About.tsx
│   │   ├── Mission.tsx
│   │   ├── MemberDirectory.tsx
│   │   ├── WhyJoin.tsx
│   │   ├── Events.tsx
│   │   ├── News.tsx
│   │   ├── Timeline.tsx
│   │   ├── ExecutiveCommittee.tsx
│   │   ├── MembershipForm.tsx
│   │   └── Contact.tsx
│   └── ui/                       # Reusable card + wrapper components
│       ├── AnimatedSection.tsx
│       ├── MemberCard.tsx
│       ├── EventCard.tsx
│       ├── NewsCard.tsx
│       └── CommitteeCard.tsx
│
├── data/                         # Static data layer
│   ├── members.ts                # 155 venue records
│   ├── events.ts                 # 10 events
│   ├── news.ts                   # 6 articles
│   └── committee.ts              # 9 committee members
│
├── context/
│   └── LocaleContext.tsx         # EN/NE locale context + useLocale() hook
│
├── lib/
│   ├── i18n.ts                   # Full EN + NE translation strings
│   └── utils.ts                  # cn(), slugify(), formatDate() family
│
├── next.config.mjs               # Next.js config
├── tailwind.config.ts            # Extended design tokens
├── tsconfig.json                 # TS config (es2017, downlevelIteration)
├── ecosystem.config.js           # PM2 process config
├── nginx.conf                    # Nginx reverse proxy config
├── deploy.sh                     # One-command deploy script
└── .env.example                  # Environment variable template
```

---

## Pages & Routes

| Route | Render Type | Description |
|-------|-------------|-------------|
| `/` | Static (SSG) | Full homepage with all sections |
| `/members` | Client | Member directory — search, area, capacity, grid/list |
| `/members/[slug]` | Static (155 pages) | Individual venue profile |
| `/events` | Client | Events list with status and type filters |
| `/news` | Client | News list with category filter |
| `/news/[slug]` | Static (6 pages) | Individual article |
| `/sitemap.xml` | Auto | Generated from members + news data |
| `/robots.txt` | Auto | Search engine directives |

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
- Search input + area dropdown + capacity dropdown filter panel
- Grid/list view toggle (animated)
- Shows first 6 filtered members as `MemberCard` components
- "View All Members" CTA → `/members`

**`WhyJoin.tsx`** — Membership benefits
- Light mesh background
- 6 white benefit cards, each with numbered navy badge, icon, title, description
- Bottom CTA block on dark navy background

**`Events.tsx`** — Events calendar
- Upcoming events grouped by month (calendar-style vertical layout)
- Past events in a sidebar panel
- Event type legend (networking / training / meeting / exhibition / conference)
- Uses `formatMonthYear()` for locale-safe month headings

**`News.tsx`** — Editorial news layout
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

**`MemberCard.tsx`**
- 176px gradient image area — color tier based on capacity:
  - Gold (500+), Blue (200–499), Emerald (100–199), Purple (<100)
- Animated pulsing building icon in image area
- SVG pattern overlay on image
- Capacity number displayed in image
- Hover: gold glow border, slight lift
- Bottom: thin colored capacity bar, venue name, area, category badge

**`EventCard.tsx`**
- Image area with decorative pattern overlay
- Color bar per event type (left edge)
- Date badge overlaid on image
- Status chip (Upcoming / Past)

**`NewsCard.tsx`**
- Colored top bar per category
- Hover: lifts with motion
- Shows: category badge, date, title, excerpt, read-more link

**`CommitteeCard.tsx`**
- Gradient initials avatar — color is deterministic by name (always same person = same color)
- President/VP: animated gold star pulse, highlighted border
- Shows name, role, organization

---

## Data Layer

**`data/members.ts`**
- 155 venue records total
- First 6 are fully detailed (real-ish data: name, area, capacity, type, phone, email, description, amenities, gallery)
- Remaining 149 are generated with realistic Nepali venue names
- Exports: `members[]`, `getAreaList()`, `getMemberBySlug(slug)`
- Member type: `{ id, name, slug, area, capacity, type, phone, email, description, amenities, established, featured }`

**`data/events.ts`**
- 10 events: 5 upcoming, 5 past
- Types: `networking | training | meeting | exhibition | conference`
- Each event: `{ id, title, date, time, location, type, status, description, attendees, image }`

**`data/news.ts`**
- 6 news articles
- Categories: `announcement | training | event | industry | member`
- Each article: `{ id, slug, title, excerpt, content, date, author, category, image, featured }`

**`data/committee.ts`**
- 9 members: President, Vice President, Secretary, Treasurer, + 5 committee members
- Each: `{ id, name, role, organization, highlighted }`

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

---

## Deployment Architecture

```
Internet → Nginx (80/443) → Next.js on port 3011 (managed by PM2)
```

- **`ecosystem.config.js`** — PM2 config: `name: "eva-nepal"`, port 3011
- **`nginx.conf`** — Reverse proxy; HTTP block active, HTTPS block commented (enable after Certbot)
- **`deploy.sh`** — `git pull → npm ci → npm run build → pm2 restart eva-nepal`
- Server target: Ubuntu 20.04+, Node 18 LTS, PM2, Nginx, 1 vCPU / 1GB RAM minimum

---

## Known Pending Items

| Item | File to edit |
|------|-------------|
| Real phone/email/social URLs for EVA Nepal | `data/committee.ts`, `components/layout/Footer.tsx`, `components/sections/Contact.tsx` |
| Replace metadataBase URL | `app/layout.tsx` |
| Add favicon.ico + og-image.jpg (1200×630px) | `/public/` directory |
| Wire membership form to real backend | `components/sections/MembershipForm.tsx` |
| Real venue photos for member profiles | `app/members/[slug]/page.tsx` |
| Real photos for committee members | `data/committee.ts` + `components/ui/CommitteeCard.tsx` |
| Update nginx.conf server_name | `nginx.conf` |
| Set up SSL via Certbot | Server-side after DNS points |
