---

CLAUDE.md — full upgrade (replace your existing file)

# EVA Nepal — Engineering Guidelines for Claude

You are acting as a senior full-stack engineer on a production system.  
 This is NOT a demo. A real organization uses this. Treat it accordingly.

---

## CONTEXT LOADING RULE — DO THIS FIRST, EVERY SESSION

1. Read this file completely.
2. Read `progress.md` — know exactly what is done and what is next.
3. Read `system_snapshot.md` — know the current schema and architecture.  


Do NOT reinterpret architecture.  
 Do NOT modify completed modules.  
 Work only on unchecked tasks in `progress.md`.  
 Do not jump phases.

---

## ENGINEERING LAWS — NEVER VIOLATE

### LAW 1 — Discuss Before Implementing

Before writing any code for a new feature or change:

- Understand what it does, what it touches, what it affects downstream
- Identify every module it affects (schema, API, admin UI, public pages)
- Flag risks or design questions before starting
- Never assume. Never skip this step.  


### LAW 2 — Never Break Existing Working Modules

- Never modify completed, working code unless explicitly asked
- Never rename files or restructure folders without a request
- Never refactor or "improve" working logic
- Always ask: "does this change break anything already working?" If yes — stop and discuss.  


### LAW 3 — Database Changes Are Additive Only

- Every new column must be nullable OR have a default value — never break existing rows
- Never drop a column, table, or relation without explicit instruction
- Never edit existing migrations — always create a new one
- After every schema change: run `npx prisma generate` and update `system_snapshot.md`
- Seed scripts must never overwrite production data  


### LAW 4 — Every Feature Must Be Fully Wired

A feature is NOT done when the happy path works.  
 It is done when ALL of the following are complete:

- [ ] Prisma schema updated (if needed) + migration applied + client regenerated
- [ ] API route created with proper input validation and error handling
- [ ] Admin page built (list + create + edit + delete + confirmation dialogs)
- [ ] Public page updated (if the feature is visible publicly)
- [ ] Loading state, empty state, and error state handled
- [ ] `progress.md` and `system_snapshot.md` updated  


### LAW 5 — Progress Tracking Is Mandatory

After completing any task:

- Check it off in `progress.md`
- Update `system_snapshot.md` if schema or architecture changed
- Do not start the next task without doing this  


---

## PROJECT IDENTITY

**Event and Venue Association Nepal (EVA Nepal)**

- Official industry body for event venues in Kathmandu since 2011
- 150+ member venues across Kathmandu Valley
- Head office: Maitidevi, Kathmandu, Nepal  


Two surfaces (today):

- **Public website** (`/`) — for the public and members to browse content
- **Admin panel** (`/admin/*`) — for admins to manage all content via CMS  


Upcoming surfaces (do not build yet — design with them in mind):

- **Member Portal** — authenticated area where members log in to see their status, event registrations, membership, payment history
- **Event Ticket Sales** — public-facing ticket purchase flow with capacity tracking
- **Meeting / Agenda Module** — AGM, committee meetings, minutes, resolutions
- **Membership Management** — tiers, dues, renewal dates, status (active/lapsed)
- **Reporting Dashboard** — member growth, event revenue, dues collected  


This is a **single-tenant** system. One association. No multi-tenancy.

---

## TECH STACK — LAW

| Layer         | Technology                                                 |
| ------------- | ---------------------------------------------------------- |
| Framework     | Next.js 14 (App Router)                                    |
| Language      | TypeScript (strict, no `any`)                              |
| Styling       | TailwindCSS 3                                              |
| Animations    | Framer Motion 11                                           |
| Icons         | lucide-react                                               |
| Fonts         | next/font/google — Inter (sans) + Playfair Display (serif) |
| ORM           | Prisma                                                     |
| Database      | PostgreSQL                                                 |
| Auth          | NextAuth.js (credentials provider)                         |
| Image Storage | Local filesystem (`/public/uploads`)                       |
| Deployment    | PM2 (port 3002) + Nginx on Linux VPS                       |

Never introduce a new major dependency without discussion.  
 If it can be done with what's already installed, do it that way.

---

## DESIGN SYSTEM

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


Do NOT redesign the public website. Do NOT rebuild public UI components.  
 The design system is complete. Use it as-is.

---

## PROJECT STRUCTURE

app/
layout.tsx Root layout — LocaleProvider, Navbar, Footer, JSON-LD schema
page.tsx Homepage: Hero → StatsSection → About → Mission → MemberDirectory  
 → WhyJoin → Events → News → Timeline → ExecutiveCommittee  
 → MembershipForm → Contact  
 globals.css Tailwind base + full design-system utilities (NO @import)  
 (admin)/  
 admin/  
 login/  
 dashboard/  
 members/  
 events/
news/
committee/
users/
settings/  
 tasks/
meetings/ ← future phase  
 tickets/ ← future phase  
 membership/ ← future phase  
 members/
page.tsx  
 [slug]/page.tsx  
 events/page.tsx  
 news/
page.tsx  
 [slug]/page.tsx  
 sitemap.ts  
 robots.ts
not-found.tsx

components/
layout/
Navbar.tsx
Footer.tsx
sections/ ← public homepage sections (DO NOT MODIFY)
admin/ ← shared admin UI components  
 ui/ ← design system primitives (MemberCard, EventCard, etc.)

lib/  
 prisma.ts ← singleton Prisma client  
 auth.ts ← NextAuth config  
 i18n.ts ← EN + NE translations  
 utils.ts ← cn(), slugify(), formatDate(), etc.

prisma/  
 schema.prisma  
 migrations/  
 seed.ts

data/ ← LEGACY static files (reference only, replaced by DB)  
 members.ts
events.ts  
 news.ts  
 committee.ts

context/
LocaleContext.tsx

types/
index.ts ← shared TypeScript types

public/
uploads/ ← image uploads

---

## ARCHITECTURE PATTERNS

### Server Components (default for reads)

Use React Server Components for all data-fetching pages.  
 Call Prisma directly in server components for straightforward reads.

```typescript
// app/(public)/members/page.tsx
import { prisma } from '@/lib/prisma'

export default async function MembersPage() {
  const members = await prisma.member.findMany({ where: { active: true } })
  return <MemberList members={members} />
}

API Routes (for all mutations)

Use /app/api/* routes for create / update / delete operations called from admin forms.

Standard response shape — always follow this:
// Success
{ success: true, data: T }

// Error
{ success: false, error: string }

Never return raw Prisma errors to the client. Always catch and format.

Client Components

Use 'use client' only when needed:
- Forms with controlled state
- Interactive UI (modals, dropdowns, filter bars)
- Any useState / useEffect usage

Authentication

All /admin/* routes are protected via NextAuth session.
Check session at the top of every admin server component or in middleware.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
if (!session) redirect('/admin/login')

---
DATABASE RULES

Schema conventions

- All models have id, createdAt, updatedAt
- Use slug for any publicly URL-addressable record (unique, generated from title/name)
- Boolean flags default to false
- Optional fields use ?

Migration discipline

# Always name migrations descriptively
npx prisma migrate dev --name add_membership_tier_to_member

# Never edit existing migrations
# After every schema change, regenerate the client
npx prisma generate

Date consistency law

Every query that filters by date must use the same field that the list/display uses.
Using a different date field in a filter vs. the display will produce wrong results.
The correct date field per model is documented in system_snapshot.md.

Cross-module integrity law

When a new feature touches multiple modules, all touch points must be wired at the same time.
Example (future): when a ticket is sold — capacity decrements, attendance is recorded,
payment is recorded, and dashboard revenue updates. Partial wiring is a bug.

---
CODE QUALITY RULES

- Strict TypeScript — no any, no implicit any
- All Prisma query results must be typed (use Prisma.ModelGetPayload or explicit interfaces)
- No duplicated API calls
- No inline business logic in page/component files — extract to /lib/ or /lib/queries/
- All forms use controlled inputs
- All API routes validate input before touching the DB
- All API routes return the standard { success, data/error } shape
- Loading states on all async admin operations
- Empty states on all list views (never blank space)
- Error states on all data fetches
- Confirmation dialog before every delete action
- Success/error toast after every mutation

---
UX STANDARDS

Every admin page must have:
- Clear page title and description
- Loading skeleton or spinner while data fetches
- Empty state message when list is empty
- Confirmation dialog before any delete
- Success/error notification after mutations

Every public page must have:
- Proper <title> and <meta description> via Next.js metadata export
- Graceful fallback if DB returns no data (never crash — show a friendly message)

---
CRITICAL GOTCHAS

1. NO @import in globals.css

Fonts load via next/font/google in app/layout.tsx. Never add @import url(...) to globals.css.

2. Locale-safe date formatting

Never use toLocaleString() or toLocaleDateString() — causes SSR/CSR hydration mismatches.
Always use the utils helpers:
import { formatDate, formatDay, formatMonthShort, formatMonthYear } from "@/lib/utils"

3. i18n type is any

The t object from useLocale() is typed as any. When using .map() on arrays inside t,
annotate callback params explicitly:
t.mission.items.map((item: { title: string; desc: string }, i: number) => ...)

4. Inline dynamic import types are banned

Do not use import("@/data/members").Member as an inline type.
Always import the type at the top of the file.

5. "use client" boundary

All components using hooks (useState, useEffect, useRef, useInView, useLocale, usePathname)
need "use client" at line 1.

6. next.config must be .mjs

Next.js 14 does not support next.config.ts. Use next.config.mjs only.

7. tsconfig target

"target": "es2017" + "downlevelIteration": true (with "ignoreDeprecations": "5.0")
required for Set spread syntax in member filtering.

---
ENVIRONMENT VARIABLES

Required in .env:
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

Never commit .env to git. Never hardcode these values anywhere.

---
DEPLOYMENT

PM2

pm2 start ecosystem.config.js   # first time
pm2 restart eva-nepal            # after rebuild
pm2 logs eva-nepal               # view logs
pm2 status
pm2 save && pm2 startup          # persist across reboots

Nginx

sudo cp nginx.conf /etc/nginx/sites-available/evanepal.org
sudo ln -s /etc/nginx/sites-available/evanepal.org /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

Full Deploy

git pull origin main && npm ci && npm run build && pm2 restart eva-nepal
# or: bash deploy.sh

SSL (after DNS is pointing)

sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d evanepal.org -d www.evanepal.org

File locations on server

/var/www/eva-nepal/           app root
/etc/nginx/sites-available/   nginx config
/var/log/pm2/                 PM2 logs
/var/log/nginx/               Nginx logs

---
NEVER DO

- Do not redesign the public website or rebuild public UI components — they are complete
- Do not store passwords in plaintext — always bcrypt
- Do not expose raw Prisma/DB errors to the client
- Do not hardcode connection strings — use .env
- Do not drop or truncate tables
- Do not skip input validation on API routes
- Do not build the member portal, ticket system, or meetings module without a full design discussion
- Do not add npm packages without checking if existing packages solve it
- Do not modify working completed modules unless explicitly asked
- Do not start the next task without updating progress.md

---
DEVELOPMENT FLOW

When implementing any feature:

1. Read progress.md and system_snapshot.md
2. Discuss approach — identify everything the feature touches
3. Update Prisma schema (if needed) + run migration + prisma generate
4. Create/update API route with validation and standard response shape
5. Create/update admin page (list + form + delete confirmation)
6. Update public page (if applicable) — replace static import with Prisma query
7. Add loading, empty, and error states
8. Update progress.md and system_snapshot.md

Correctness > UX polish > Speed.
A boring working implementation beats a clever broken one.

---
```
