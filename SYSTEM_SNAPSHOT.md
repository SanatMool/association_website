# EVA Nepal — System Snapshot

Read this before any schema change, API change, or structural decision.
Update this after every migration or architectural change.

Last updated: 2026-08-27 (Phase C — Meeting Enhancements + Phase D — Financial Ledger complete)

---

## Architecture Overview

```
assoc-platform.nibjar.com  →  /platform/*  (Platform Admin — nibjar team only)
eva.nibjar.com             →  / + /admin/* (EVA Nepal public site + admin panel)
bhaktapur.nibjar.com       →  / + /admin/* (Bhaktapur public site + admin panel)
localhost                  →  / + /admin/* (dev — uses DEV_ASSOCIATION_SLUG=eva-nepal fallback)
```

Single Next.js 14 (App Router) monorepo serves all domains.

```
middleware.ts
  ├── Reads `host` header
  ├── assoc-platform.nibjar.com → enforces platform-session-token cookie → /platform/*
  ├── /platform/* on non-platform domains → redirect to /
  ├── /admin/* → enforces NextAuth JWT (default cookie name)
  └── All routes → injects x-hostname header for server components

lib/getAssociation.ts
  └── React.cache() — reads x-hostname, queries Association by domain, one DB call per request

lib/adminAuth.ts
  └── getAdminContext() — reads NextAuth session, returns { session, associationId }

lib/platformAuth.ts
  └── getPlatformUser() — reads platform-session-token cookie, decodes JWT, returns user
```

**Three auth tiers:**

| Tier         | Model        | Auth mechanism             | Cookie                    | Scope             |
| ------------ | ------------ | -------------------------- | ------------------------- | ----------------- |
| Platform     | PlatformUser | Custom JWT via encode()    | platform-session-token    | All associations  |
| Assoc Admin  | AdminUser    | NextAuth credentials       | next-auth.session-token   | One association   |
| Public       | —            | None                       | —                         | Read-only         |

**State management rule:** Server Components for reads. React state for UI filters. `fetch()` for mutations. No React Query, no Axios, no Zustand.

---

## Database

- ORM: Prisma v7
- Adapter: @prisma/adapter-pg (native Postgres driver, no `url` in datasource block)
- DB: PostgreSQL 14+
- Config file: `prisma.config.ts` (loads `.env` via `dotenv/config`)
- Client singleton: `lib/prisma.ts`
- Connection: `DATABASE_URL` in `.env` (not `.env.local` — Prisma reads `.env`)

Dev credentials: `postgresql://sanatmool@localhost:5432/evanepal`

---

## Prisma Schema — Current Models

### Association

| Field         | Type            | Notes                                    |
| ------------- | --------------- | ---------------------------------------- |
| id            | String (cuid)   | PK                                       |
| name          | String          | "Event and Venue Association Nepal"      |
| nameNe        | String?         | Nepali name                              |
| slug          | String @unique  | "eva-nepal", "bhaktapur"                 |
| domain        | String @unique  | "eva.nibjar.com", "bhaktapur.nibjar.com" |
| logo          | String?         | Path to /public/ logo                    |
| themeColor    | String          | Default "#0a1040" — mirrors colorPreset's primary anchor, read by PWA manifest routes + viewport theme-color |
| accentColor   | String          | Default "#f59e0b" — mirrors colorPreset's accent anchor, read by PWA manifest routes |
| colorPreset   | String          | Default "navy-gold" — key into lib/theme-presets.ts, drives public site + portal CSS var theming |
| homepageContent | Json?         | Nullable — shape `HomepageContent` in lib/homepage-content.ts (heroSlides, aboutImage/Headline/Badge, missionItems, whyjoinItems); each field falls back to hardcoded/i18n default when unset |
| foundedYear   | Int?            |                                          |
| description   | String?         |                                          |
| descriptionNe | String?         |                                          |
| active        | Boolean         | Default true                             |
| plan          | String          | "basic" — platform plan tracking         |
| createdAt     | DateTime        | Auto                                     |
| updatedAt     | DateTime        | Auto                                     |

Relations: `memberLinks MemberAssociation[]`, `events Event[]`, `news News[]`, `committee CommitteeMember[]`, `admins AdminUser[]`, `settings SiteSettings[]`, `timeline TimelineEntry[]`, `apiLogs ApiLog[]`, `memberGroups MemberGroup[]`, `financialYears FinancialYear[]`, `financialAccounts FinancialAccount[]`, `journalEntries JournalEntry[]`

### MemberAssociation (join table — Members ↔ Associations)

| Field           | Type          | Notes                                            |
| --------------- | ------------- | ------------------------------------------------ |
| id              | String (cuid) | PK                                               |
| memberId        | String        | FK → Member (CASCADE delete)                     |
| associationId   | String        | FK → Association (CASCADE delete)                |
| memberCategoryId| String?       | FK → MembershipCategory                          |
| designationId   | String?       | FK → Designation (Phase A)                       |
| showPhone       | Boolean       | Default false — whether phone is shown publicly  |
| showEmail       | Boolean       | Default false — whether email is shown publicly  |
| visible         | Boolean       | Default true. Admin of THIS association controls |
| primary         | Boolean       | Default true. Which assoc is member's "home"     |
| joinedAt        | DateTime      | Auto                                             |

`@@unique([memberId, associationId])`

**CRITICAL — relation field names:**
- On `Member` model: `associations MemberAssociation[]`
- On `Association` model: `memberLinks MemberAssociation[]`
- Always use `associations` when filtering on `prisma.member.*`
- Always use `memberLinks` when filtering/counting on `prisma.association.*`

### Member

| Field       | Type            | Notes                                      |
| ----------- | --------------- | ------------------------------------------ |
| id          | String (cuid)   | PK                                         |
| name        | String          | Business name or person name (English)     |
| nameNe      | String?         | Business/person name (Nepali)              |
| slug        | String @unique  | URL key                                    |
| area        | String          |                                            |
| capacity    | Int?            | **Nullable** — not used in person mode     |
| type        | String?         | **Nullable**                               |
| category    | String?         |                                            |
| phones      | String[]        | **Phase B** — array of phones; default []  |
| phone       | String?         | LEGACY — kept for backward compat          |
| email       | String?         |                                            |
| website     | String?         |                                            |
| description | String?         |                                            |
| amenities   | String[]        |                                            |
| memberSince | String?         |                                            |
| established | Int?            |                                            |
| featured    | Boolean         | Default false                              |
| active      | Boolean         | Default true                               |
| image       | String?         |                                            |
| ownerName   | String?         | Owner name (English)                       |
| ownerNameNe | String?         | Owner name (Nepali)                        |
| addressNe   | String?         | Address (Nepali)                           |
| location    | String?         |                                            |
| createdAt   | DateTime        | Auto                                       |
| updatedAt   | DateTime        | Auto                                       |

Relations: `associations MemberAssociation[]`, `committeeMemberships CommitteeMember[]`, `memberGroupLinks MemberGroupLink[]`

**Date anchor**: `createdAt`

### MemberGroup (Phase B — per-association groups/professions)

| Field         | Type          | Notes                    |
| ------------- | ------------- | ------------------------ |
| id            | String (cuid) | PK                       |
| associationId | String        | FK → Association CASCADE |
| name          | String        |                          |
| nameNe        | String?       |                          |
| order         | Int           | Default 0                |
| createdAt     | DateTime      | Auto                     |
| updatedAt     | DateTime      | Auto                     |

### MemberGroupLink (join table — Member ↔ MemberGroup)

| Field         | Type          | Notes                                      |
| ------------- | ------------- | ------------------------------------------ |
| id            | String (cuid) | PK                                         |
| memberId      | String        | FK → Member CASCADE                        |
| memberGroupId | String        | FK → MemberGroup CASCADE                   |

`@@unique([memberId, memberGroupId])`

### Event

| Notable fields | Notes                        |
| -------------- | ---------------------------- |
| associationId  | String? FK → Association     |
| date           | DateTime — **date anchor**   |
| endDate        | DateTime?                    |

### TicketType (event ticketing — migration `20260612110421`)

| Field          | Type          | Notes                                            |
| -------------- | ------------- | ------------------------------------------------- |
| eventId        | String        | FK → Event (CASCADE)                               |
| associationId  | String        | FK → Association (CASCADE)                         |
| price          | Decimal       | @default(0)                                        |
| memberPrice    | Decimal?      | optional discounted price for members              |
| totalCapacity  | Int?          | null = unlimited                                   |
| strictCapacity | Boolean       | @default(false) — block when soldCount >= capacity |
| soldCount      | Int           | @default(0), incremented atomically on registration |

### TicketRegistration (migration `20260612110421`)

| Field          | Type          | Notes                                                    |
| -------------- | ------------- | ---------------------------------------------------------- |
| ticketTypeId   | String        | FK → TicketType                                             |
| eventId        | String        | FK → Event (CASCADE)                                        |
| paymentStatus  | String        | "pending" \| "paid" \| "cancelled" \| "refunded"             |
| checkInToken   | String        | @unique @default(cuid()) — issued at registration           |
| checkedIn      | Boolean       | @default(false)                                             |

No separate `TicketPurchase`/`EventAttendance` models — buyer/payment fields and check-in tracking live directly on `TicketRegistration`. See PROGRESS.md "Phase 5 — Event Ticket Sales ✓ COMPLETE" for the full field list and wiring notes.

### News

| Notable fields | Notes                             |
| -------------- | --------------------------------- |
| associationId  | String? FK → Association          |
| publishedAt    | DateTime — **date anchor**        |
| createdAt      | DateTime — added in multi-tenancy |

### CommitteeMember

| Notable fields | Notes                        |
| -------------- | ---------------------------- |
| associationId  | String? FK → Association     |
| nameNe         | String?                      |
| venueNe        | String?                      |
| memberId       | String? FK → Member (optional link to a registered Member — snapshot-at-link, not live-synced) |
| designationId  | String? FK → Designation (added 2026-08-28 — role in the association's own role vocabulary; admin form falls back to a fixed hardcoded role list only if the association has zero Designations) |

### TimelineEntry

| Field         | Type          | Notes                          |
| ------------- | ------------- | ------------------------------ |
| id            | String (cuid) | PK                             |
| associationId | String        | FK → Association (CASCADE)     |
| year          | Int           |                                |
| title         | String        |                                |
| titleNe       | String?       |                                |
| description   | String        |                                |
| descriptionNe | String?       |                                |
| stat          | String?       | Decorative e.g. "150+ Members" |
| highlighted   | Boolean       | Default false                  |
| order         | Int           | Display order                  |

Section hides if no entries for the association.

### Designation (NEW — Phase A)

| Field         | Type          | Notes                                              |
| ------------- | ------------- | -------------------------------------------------- |
| id            | String (cuid) | PK                                                 |
| associationId | String        | FK → Association (CASCADE)                         |
| name          | String        | "President", "Secretary", "Treasurer", etc.        |
| systemRole    | String        | "admin" \| "editor" \| "member"                   |
| permissions   | String[]      | Permission keys — only for "editor" systemRole     |
| isDefault     | Boolean       | Default false                                      |
| order         | Int           | Display order                                      |

6 default designations seeded per new association (President/VP/Secretary/Treasurer/Committee Member/General Member).

### AdminUser

| Notable fields  | Notes                                              |
| --------------- | -------------------------------------------------- |
| associationId   | String? FK → Association                           |
| password        | String? (bcrypt hashed)                            |
| role            | String default "admin" — LEGACY, keep for JWT compat |
| systemRole      | String default "admin" — "admin" \| "editor" \| "member" |
| designationId   | String? FK → Designation                           |
| extraPermissions | String[] — permission overrides beyond designation |
| deletedAt       | DateTime? — soft delete (never hard-delete admins) |

### SiteSettings

Unique constraint changed from `key @unique` to `@@unique([key, associationId])`.
`associationId String?` added.

### AdminTask

`associationId String?` added.

### MembershipApplication

| Field         | Type          | Notes                                        |
| ------------- | ------------- | -------------------------------------------- |
| id            | String (cuid) | PK                                           |
| venueName     | String        | Required                                     |
| ownerName     | String        | Required                                     |
| phone         | String        | Required                                     |
| email         | String        | Required                                     |
| location      | String        | Required                                     |
| capacity      | String?       | Optional (e.g. "500")                        |
| website       | String?       | Optional                                     |
| status        | String        | Default "pending" — pending/reviewed/accepted/rejected |
| associationId | String?       | FK → Association (nullable)                  |
| createdAt     | DateTime      | Auto                                         |
| updatedAt     | DateTime      | Auto                                         |

Admin route: `/admin/applications` — list + status filter + detail panel + status update + delete.

### PlatformUser

| Field     | Type            | Notes         |
| --------- | --------------- | ------------- |
| id        | String (cuid)   | PK            |
| email     | String @unique  |               |
| password  | String          | bcrypt hashed |
| name      | String          |               |
| createdAt | DateTime        | Auto          |
| updatedAt | DateTime        | Auto          |

### ApiLog

| Field          | Type          | Notes                           |
| -------------- | ------------- | ------------------------------- |
| id             | String (cuid) | PK                              |
| associationId  | String?       | FK → Association                |
| path           | String        |                                 |
| method         | String        |                                 |
| statusCode     | Int           |                                 |
| responseTimeMs | Int           | milliseconds                    |
| adminUserId    | String?       | AdminUser id if authenticated   |
| ip             | String?       |                                 |
| errorMessage   | String?       |                                 |
| createdAt      | DateTime      | Auto                            |

### MeetingAttendance (Phase C)

| Field         | Type          | Notes                                    |
| ------------- | ------------- | ---------------------------------------- |
| id            | String (cuid) | PK                                       |
| meetingId     | String        | FK → Meeting (CASCADE)                   |
| memberId      | String        | FK → Member (CASCADE)                    |
| markedAt      | DateTime      | Default now()                            |
| markedByAdminId | String?     | FK → AdminUser (nullable)                |

`@@unique([meetingId, memberId])`

Phase C also added: `AgendaItem.resolved Boolean @default(false)`, `MeetingMinutes.contentNe String?`

### FinancialYear (Phase D)

| Field          | Type          | Notes                                       |
| -------------- | ------------- | ------------------------------------------- |
| id             | String (cuid) | PK                                          |
| associationId  | String        | FK → Association (CASCADE)                  |
| label          | String        | "FY 2026"                                   |
| startDateAD    | DateTime      |                                             |
| endDateAD      | DateTime      |                                             |
| openingBalance | Decimal(10,2) | Default 0                                   |
| status         | String        | "active" \| "closed"                        |
| closedAt       | DateTime?     | Set when status → closed                    |

`@@index([associationId])`

### FinancialAccount (Phase D)

| Field         | Type          | Notes                                        |
| ------------- | ------------- | -------------------------------------------- |
| id            | String (cuid) | PK                                           |
| associationId | String        | FK → Association (CASCADE)                   |
| code          | String        | "1001" through "5004"                        |
| name          | String        | "Cash in Hand", "Bank Account", etc.         |
| type          | String        | "asset" \| "income" \| "expense" \| "liability" |
| isDefault     | Boolean       | Default false — blocks delete if true        |
| order         | Int           | Display order, default 0                     |

`@@unique([associationId, code])` — 10 default accounts seeded per association

### JournalEntry (Phase D)

| Field            | Type          | Notes                                          |
| ---------------- | ------------- | ---------------------------------------------- |
| id               | String (cuid) | PK                                             |
| associationId    | String        | FK → Association (CASCADE)                     |
| financialYearId  | String        | FK → FinancialYear (CASCADE)                   |
| date             | DateTime      | Transaction date                               |
| description      | String        |                                                |
| debitAccountId   | String        | FK → FinancialAccount "DebitAccount" relation  |
| creditAccountId  | String        | FK → FinancialAccount "CreditAccount" relation |
| amount           | Decimal(10,2) |                                                |
| reference        | String?       | Invoice/receipt ref                            |
| entityType       | String?       | "dues" \| "expense" \| "contribution" \| "ticket" \| "manual" |
| entityId         | String?       | Links back to source record                    |
| createdByAdminId | String?       | FK → AdminUser                                 |

`@@index([associationId, financialYearId, date])`, `@@index([entityType, entityId])`

**Auto-journal**: `lib/autoJournal.ts` — fire-and-forget; silently skips if no active year exists.
Wired into: expense creation, dues payment, contribution payment, ticket payment confirmation.

---

## Migrations Applied

| File                                                   | Description                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| 20260311062057_init                                    | Initial schema: Member, Event, News, CommitteeMember, AdminUser     |
| 20260311073313_add_site_settings                       | SiteSettings model                                                  |
| 20260311074654_add_admin_tasks                         | AdminTask model                                                     |
| 20260508120000_add_committee_nepali_fields             | nameNe, venueNe on CommitteeMember                                  |
| 20260609000000_add_multi_tenancy_association_platform  | Full multi-tenancy: 5 new models, associationId on all content rows |
| 20260609091232_add_membership_application              | MembershipApplication model                                         |
| 20260612110421_add_ticket_types_and_registrations       | TicketType + TicketRegistration models (Phase 5 — Event Ticket Sales) |
| 20260609120537_add_phases_3_4_6_7                      | MembershipCategory, DuesPayment, Meeting, AgendaItem, MeetingMinutes, ExpenseVendor, Expense, MemberContribution, MemberAccount, MeetingRsvp, EventRsvp — memberCategoryId on MemberAssociation |
| 20260702115537_add_due_amount_partial_status           | DuesPayment: dueAmount Decimal? added; status now supports "partial" (paid < dueAmount) |
| 20260826115713_add_designation_role_system             | Designation model; AdminUser: systemRole, designationId, extraPermissions, deletedAt; MemberAssociation: designationId |
| 20260826123225_add_member_generalization               | Member.phones String[]; MemberAssociation: showPhone, showEmail; CommitteeMember.memberId; MemberGroup + MemberGroupLink models |
| 20260827014000_add_phase_c_meeting_enhancements        | AgendaItem.resolved Boolean; MeetingMinutes.contentNe String?; MeetingAttendance model |
| 20260827015825_add_financial_ledger                    | FinancialYear, FinancialAccount, JournalEntry models; relations on Association |
| 20260827105327_add_email_failure_tracking              | `emailFailedAt DateTime?` + `emailError String?` added to Member, MembershipApplication, MemberAccount, TicketRegistration |
| 20260828101059_add_designation_link_to_committee_member | `CommitteeMember.designationId String?` FK → Designation (+ `committeeMembers CommitteeMember[]` relation on Designation) |
| 20260830061702_add_color_preset_to_association          | `Association.colorPreset String @default("navy-gold")` |
| 20260830085806_add_homepage_content_to_association       | `Association.homepageContent Json?` |
| 20260830095726_add_event_promo_recap_galleries            | `Event.promoImages String[]`, `Event.recapImages String[]`, `Event.recapVideoUrl String?` |

---

## File Structure — Key Files

```
app/
  layout.tsx                    Root layout (LocaleProvider, PublicChrome, Footer)
  page.tsx                      Homepage — getAssociationOrThrow(), all queries by associationId
  opengraph-image.tsx           Dynamic og:image (next/og ImageResponse) — resolves association by
                                 hostname directly (NOT getAssociation(), see CRITICAL note below —
                                 this file compiles to a route handler, not a render-tree component)
  sitemap.ts                    Scoped to association domain
  members/page.tsx              Server component — members via associations join
  members/[slug]/page.tsx       ISR — member verified against association
  events/page.tsx               Server component — by associationId
  news/page.tsx                 Server component — by associationId
  news/[slug]/page.tsx          ISR — news verified against association
  (admin)/
    admin/
      layout.tsx                Sidebar nav (client) — uses useSession
      dashboard/page.tsx        Stats scoped by associationId
      members/page.tsx          Members via associations join
      events/page.tsx           By associationId
      news/page.tsx             By associationId
      committee/page.tsx        By associationId
      users/page.tsx            By associationId
      settings/page.tsx         Fetches /api/settings (session-scoped)
      tasks/page.tsx            By associationId
  (platform)/
    platform/
      layout.tsx                Platform sidebar (client) — indigo theme
      login/page.tsx            Login form → POST /api/platform-auth
      dashboard/page.tsx        All associations overview + recent logs
      associations/page.tsx     Full associations table
      associations/[id]/page.tsx Association detail, admins, logs
      logs/page.tsx             API logs table (last 200)
  api/
    auth/[...nextauth]/         NextAuth handler
    platform-auth/route.ts      POST login / DELETE logout (platform users)
    members/route.ts            GET+POST scoped by association
    members/[id]/route.ts       GET/PUT/DELETE — ownership via MemberAssociation
    events/route.ts             GET+POST scoped
    events/[id]/route.ts        GET/PUT/DELETE — ownership verified
    news/route.ts               GET+POST scoped
    news/[id]/route.ts          GET/PUT/DELETE — ownership verified
    committee/route.ts          GET+POST scoped
    committee/[id]/route.ts     GET/PUT/DELETE — ownership verified
    users/route.ts              GET+POST scoped
    users/[id]/route.ts         DELETE — scoped last-user guard
    settings/route.ts           GET+PUT scoped
    tasks/route.ts              GET+POST scoped
    tasks/[id]/route.ts         PUT+DELETE — ownership verified
    upload/route.ts             POST — image upload

lib/
  prisma.ts                     Singleton PrismaClient
  auth.ts                       NextAuth options — includes associationId in JWT
  getAssociation.ts             getAssociation() + getAssociationOrThrow() — React.cache()
  adminAuth.ts                  getAdminContext() → { session, associationId }
  platformAuth.ts               getPlatformUser() → PlatformUser | null
  settings.ts                   getSettings(associationId?) → Record<string,string>
  types.ts                      MemberType, EventType, NewsType, CommitteeType, TimelineType, AssociationType
  i18n.ts                       EN + NE translations
  utils.ts                      cn(), slugify(), formatDate() family
  theme-presets.ts              10 curated color presets (navy/gold shade ramps) + hexToRgbTriple/themePresetToCssVars helpers
  homepage-content.ts           HomepageContent type, curated SECTION_ICONS map, sanitizeHomepageContent() validator for Hero/About/Mission/WhyJoin/Events-header per-association overrides
  event-gallery.ts              sanitizeEventGalleryFields() — caps Event.promoImages/recapImages length, validates recapVideoUrl
  uploadsCleanup.ts             cleanupOrphanedUploads() — deletes public/uploads files with zero DB references across every association; 24h grace period on file age. mergeDuplicateUploads() — SHA-256-groups byte-identical files, rewrites every referencing record to a canonical file and deletes the rest, but ONLY when every reference in the group belongs to one association (cross-association duplicates are reported, never auto-merged). Any new model field that can hold an uploaded image path must be added to BOTH collectReferencedFilenames() and collectFileReferences() or it'll be treated as orphaned / invisible to dedup.

components/
  layout/
    PublicChrome.tsx             Suppresses Navbar/Footer for /admin/* and /platform/*
```

---

## API Routes

| Route                  | Methods          | Auth required    | Scope         |
| ---------------------- | ---------------- | ---------------- | ------------- |
| /api/auth/[...nextauth]| GET, POST        | —                | —             |
| /api/platform-auth     | POST, DELETE     | —                | Platform JWT  |
| /api/upload            | POST             | Admin session    | association   |
| /api/members           | GET, POST        | POST: admin      | association   |
| /api/members/[id]      | GET, PUT, DELETE | PUT/DELETE: admin| association   |
| /api/events            | GET, POST        | POST: admin      | association   |
| /api/events/[id]       | GET, PUT, DELETE | PUT/DELETE: admin| association   |
| /api/news              | GET, POST        | POST: admin      | association   |
| /api/news/[id]         | GET, PUT, DELETE | PUT/DELETE: admin| association   |
| /api/committee         | GET, POST        | POST: admin      | association   |
| /api/committee/[id]    | GET, PUT, DELETE | PUT/DELETE: admin| association   |
| /api/users             | GET, POST        | Admin session    | association   |
| /api/users/[id]        | DELETE           | Admin session    | association   |
| /api/settings          | GET, PUT         | PUT: admin       | association   |
| /api/tasks             | GET, POST        | Admin session    | association   |
| /api/tasks/[id]        | PUT, DELETE      | Admin session    | association   |

Standard response shape: `{ success: true, data: T }` / `{ success: false, error: string }`

**POST /api/members** creates both a `Member` record and a `MemberAssociation` link in a `$transaction`.

**/api/upload** re-encodes every upload to WebP via `sharp` (already a prod dependency) — quality 80, max 1920px longest dimension (`fit: "inside"`, never upscales), EXIF-rotation applied before resize, rejects non-image MIME types and anything over 5MB raw (lowered from an initial 15MB same day, per user request — compression already keeps the *stored* file tiny regardless of the raw ceiling; the ceiling exists only to bound memory/CPU use during processing). Typically 90%+ size reduction vs. the original. See PROGRESS.md "Image upload compression" (2026-08-30).

**AI generation model**: `app/api/ai/generate/route.ts` uses Groq's `openai/gpt-oss-120b` (swapped 2026-08-30 after Groq fully deprecated `llama-3.3-70b-versatile`). If generation starts failing with a "not configured" error again, check `GET https://api.groq.com/openai/v1/models` with the real key before assuming the key itself is the problem — Groq deprecates/renames models without warning. `callAI()` takes an optional `temperature` param (default 0.7); the `translate` type calls it at `0.2` — do the same for any new *fidelity* task (must not embellish/invent), keep 0.7+ for genuinely creative generation types.

**nginx upload limit**: `nginx.conf` needs `client_max_body_size 6m;` (already added to the repo's template — 1MB headroom above the app's 5MB ceiling) — without it, nginx rejects uploads over ~1MB with a raw 413 before the request ever reaches `/api/upload`'s own check. If the live server's actual nginx config diverges from this repo's template (likely, given multiple subdomains now), the directive must be added there too, then `sudo nginx -t && sudo systemctl reload nginx`.

**Event image galleries**: `components/ui/ImageLightboxGallery.tsx` (client component) renders a scroll-snap thumbnail strip + full-screen lightbox modal (prev/next, keyboard nav, Escape-to-close) — used on `app/events/[slug]/page.tsx` for both `Event.promoImages` (shown while upcoming) and `Event.recapImages` (shown once past, falls back to `promoImages` if recap is empty so uploaded photos are never hidden entirely).

---

## Shared Types (lib/types.ts)

```typescript
MemberType       // id, slug, name, nameNe?, location?, area, capacity? (nullable),
                 // phone? (nullable), website?, category?, type?, description?,
                 // amenities?, memberSince?, featured?, image?,
                 // ownerName?, ownerNameNe?, addressNe?

EventType        // id, slug, title, titleNe?, description, date (ISO), endDate?, location, type, status, image?
NewsType         // id, slug, title, titleNe?, excerpt, content?, date (ISO), category, author, image?, featured?
CommitteeType    // id, name, nameNe?, role, roleKey, venue?, venueNe?, bio?, order, highlighted?, image?
TimelineType     // id, year, title, titleNe?, description, descriptionNe?, stat?, highlighted, order
AssociationType  // id, name, nameNe?, slug, domain, logo?, themeColor, accentColor, foundedYear?, description?, descriptionNe?
```

Rule: Prisma returns `Date` objects. Always convert to ISO strings before passing to Client Components.

---

## Seed Data

Source: `data/*.ts` (EVA Nepal) + inline Bhaktapur records in `prisma/seed.ts`

Run: `npx prisma db seed`

| Association | Domain                   | Members | Events | News | Committee | Timeline | Admins |
| ----------- | ------------------------ | ------- | ------ | ---- | --------- | -------- | ------ |
| EVA Nepal   | eva.nibjar.com           | 155     | 10     | 6    | 16        | 9        | 1      |
| Bhaktapur   | bhaktapur.nibjar.com     | 41      | 0      | 0    | 0         | 0        | 1      |

Credentials:
- `admin@evanepal.org` / `admin123` → EVA Nepal admin
- `admin@bhaktapurassociation.org` / `admin123` → Bhaktapur admin
- `admin@nibjar.com` / `platform123` → PlatformUser (all associations)

**NEVER run seed against production without verifying it does not overwrite existing data.**

---

## Environment Variables

```
DATABASE_URL=postgresql://sanatmool@localhost:5432/evanepal    # dev (Prisma reads .env)
DATABASE_URL=postgresql://user:pass@localhost:5432/evanepal    # prod
NEXTAUTH_SECRET=<32-char random string>
NEXTAUTH_URL=http://localhost:3000    # https://eva.nibjar.com in production
DEV_ASSOCIATION_SLUG=eva-nepal        # optional — controls which association loads on localhost
```

**Note:** Prisma reads `.env`, not `.env.local`. NextAuth reads both. Keep `DATABASE_URL` in `.env`.

---

## Future Models (do not add without full design discussion)

| Model            | Phase | Linked to              |
| ---------------- | ----- | ---------------------- |
| MembershipPlan   | 3     | Association            |
| MembershipRecord | 3     | Member, MembershipPlan |
| DuesPayment      | 3     | MembershipRecord       |
| MemberAccount    | 4     | Member                 |
| TicketType       | 5     | Event                  |
| TicketPurchase   | 5     | TicketType             |
| EventAttendance  | 5     | TicketPurchase         |
| Meeting          | 6     | Association            |
| AgendaItem       | 6     | Meeting                |
| MeetingMinutes   | 6     | Meeting                |

---

## Build Health

Last verified: 2026-06-10

```
✓ npx tsc --noEmit — 0 errors
✓ Migration 20260609120537_add_phases_3_4_6_7 — APPLIED
✓ Phase 3 — MembershipCategory + DuesPayment admin ✓
✓ Phase 4 — Member Portal (auth + pages + admin portal-accounts) ✓
✓ Phase 6 — Meetings, Agenda, Expenses, Contributions, Minutes ✓
✓ Phase 7 — Reporting dashboard (/admin/reports) ✓
```

## New API Routes (Phases 3, 4, 6, 7)

| Route | Methods | Auth | Notes |
|---|---|---|---|
| /api/membership/categories | GET, POST | Admin | Fee categories per association |
| /api/membership/categories/[id] | PUT, DELETE | Admin | |
| /api/membership/dues | GET, POST | Admin | Filter by memberId/status/type |
| /api/membership/dues/[id] | PATCH, DELETE | Admin | Auto-sets paidAt on status→paid |
| /api/membership/member-category/[id] | PATCH | Admin | Assign category to MemberAssociation |
| /api/meetings | GET, POST | Admin | |
| /api/meetings/[id] | GET, PUT, DELETE | Admin | Full includes: agenda, minutes, expenses, contributions |
| /api/meetings/[id]/agenda | POST | Admin | Auto-increments order |
| /api/meetings/[id]/agenda/[itemId] | PUT, DELETE | Admin | |
| /api/meetings/[id]/minutes | PUT | Admin | Upsert, optional publish |
| /api/meetings/[id]/expenses | POST | Admin | vendorId OR free-text + saveVendor flag |
| /api/meetings/[id]/expenses/[expenseId] | DELETE | Admin | |
| /api/meetings/[id]/contributions | POST | Admin | |
| /api/meetings/[id]/contributions/[contribId] | PATCH, DELETE | Admin | |
| /api/expense-vendors | GET | Admin | Saved vendor list for dropdown |
| /api/portal-auth | POST, DELETE | — | Sets/clears member-portal-token cookie |
| /api/portal/me | GET | Portal | Returns member + association info |
| /api/portal/events | GET | Portal | Events with current member's RSVPs |
| /api/portal/meetings | GET | Portal | Meetings with agenda, minutes, RSVPs |
| /api/portal/dues | GET | Portal | DuesPayments for current member |
| /api/portal/rsvp/events/[id] | POST, DELETE | Portal | Upsert/remove EventRsvp |
| /api/portal/rsvp/meetings/[id] | POST, DELETE | Portal | Upsert/remove MeetingRsvp |
| /api/admin/portal-accounts | GET, POST | Admin | List members with portal status; create account |
| /api/admin/portal-accounts/[id] | PATCH, DELETE | Admin | Reset password / delete account |
| /api/admin/reports | GET | Admin | All reporting metrics in one call |
| /api/admin/branding | GET, PUT | Admin | GET returns name/logo/description/colorPreset/homepageContent; PUT sets logo and/or colorPreset (+ mirrors themeColor/accentColor) and/or homepageContent (validated via lib/homepage-content.ts sanitizeHomepageContent) |
| /api/platform/uploads-cleanup | POST | Platform | Scans/deletes orphaned public/uploads files, or (with `mode: "duplicates"`) finds+merges byte-identical files (lib/uploadsCleanup.ts); body `{ dryRun, mode }`, `dryRun` defaults to `true` |

## Known Issues / Watch Points

- TypeScript validation is skipped during `npm run build` (Next.js config). Run `npx tsc --noEmit` separately to catch type errors.
- `Member.associations` (not `memberLinks`) — the relation field on the Member model for its join table entries. A previous session accidentally used `memberLinks` on member queries; this was corrected.
- `SiteSettings` unique constraint is composite `[key, associationId]` — cannot use `where: { key }` alone. Always use `findFirst({ where: { key, associationId } })` then update by `id`.
