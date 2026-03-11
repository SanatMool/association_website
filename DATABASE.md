# EVA Nepal — Database & API Reference

## Overview

- **Database**: PostgreSQL (local)
- **ORM**: Prisma v7 with `@prisma/adapter-pg`
- **Auth**: NextAuth v4 (JWT strategy, Credentials + optional Google OAuth)
- **DB name**: `evanepal`
- **DB host**: `localhost:5432`
- **DB user**: `sanatmool` (macOS system user — the PostgreSQL superuser on this machine)

---

## Connection

### Environment Variables

Set in **`.env.local`** (never committed to git):

```
DATABASE_URL="postgresql://sanatmool@localhost:5432/evanepal"
NEXTAUTH_URL="http://localhost:3011"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
GOOGLE_CLIENT_ID=""         # optional — leave blank to disable Google login
GOOGLE_CLIENT_SECRET=""     # optional
```

> **Production**: change `DATABASE_URL` to point to the VPS postgres instance with a password.
> Example: `postgresql://evanepal_user:strongpassword@localhost:5432/evanepal`

### Prisma Config (`prisma.config.ts`)

Prisma v7 does **not** accept `url` inside `schema.prisma`. The connection URL is read from `prisma.config.ts`:

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node -P tsconfig.seed.json prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

### Prisma Client (`lib/prisma.ts`)

Prisma v7 with PostgreSQL requires `@prisma/adapter-pg`. The client is a singleton to avoid connection pool exhaustion in dev:

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
```

---

## Database Setup (First Time)

```bash
# 1. Create the database (macOS — postgres runs as system user)
createdb evanepal

# 2. Run migrations
npx prisma migrate dev --name init

# 3. Generate Prisma client
npx prisma generate

# 4. Seed the database with all static data
npx prisma db seed
# Seeds: 155 members, 10 events, 6 news articles, 9 committee members, 1 admin user
```

### Verify Connection

```bash
psql evanepal                  # open psql shell
\dt                            # list all tables
SELECT COUNT(*) FROM "Member"; # should return 155
```

Or use Prisma Studio:
```bash
npx prisma studio              # opens browser UI at http://localhost:5555
```

---

## Prisma Schema

File: `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  # url is NOT here — it lives in prisma.config.ts (Prisma v7 requirement)
}

generator client {
  provider = "prisma-client-js"
}

model Member {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  location    String?
  area        String
  capacity    Int
  type        String
  category    String?
  phone       String
  email       String?
  website     String?
  description String?
  amenities   String[]
  memberSince String?
  established Int?
  featured    Boolean  @default(false)
  image       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Event {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  titleNe     String?
  description String
  date        DateTime
  endDate     DateTime?
  location    String
  type        String
  status      String
  attendees   Int?
  image       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model News {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  titleNe     String?
  excerpt     String
  content     String
  author      String
  category    String
  image       String?
  featured    Boolean  @default(false)
  publishedAt DateTime
  updatedAt   DateTime @updatedAt
}

model CommitteeMember {
  id           String   @id @default(cuid())
  name         String
  role         String
  roleKey      String   @default("member")
  organization String?
  venue        String?
  bio          String?
  order        Int      @default(99)
  highlighted  Boolean  @default(false)
  image        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model AdminUser {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String?  # null for OAuth-only users
  role      String   @default("admin")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Admin Users

### Default Seeded User

| Field    | Value                  |
|----------|------------------------|
| Email    | `admin@evanepal.org`   |
| Password | `admin123`             |
| Role     | `admin`                |
| Name     | `EVA Nepal Admin`      |

> **Change this password immediately after first login.** The seed stores it as a bcrypt hash.

### How to Add Another Admin

Two options:

**Option A — Via psql directly:**
```bash
# Generate bcrypt hash first (Node.js one-liner)
node -e "const b=require('bcryptjs'); b.hash('newpassword123',10).then(h=>console.log(h))"

# Insert into DB
psql evanepal
INSERT INTO "AdminUser" (id, name, email, password, role, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'New Admin', 'new@evanepal.org', '<bcrypt_hash>', 'admin', now(), now());
```

**Option B — Re-run seed (adds only if not exists):**
Edit `prisma/seed.ts` to add more admin entries, then run `npx prisma db seed`.

---

## API Routes

All routes are under `/api/`. JSON request/response. Protected routes require NextAuth session (currently only admin panel uses these; public reads are done server-side via Prisma directly).

### Members

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/members` | List all members. Optional `?search=` query param. |
| `POST` | `/api/members` | Create a new member. Body: member fields as JSON. |
| `GET` | `/api/members/[id]` | Get single member by ID. |
| `PUT` | `/api/members/[id]` | Update member. Body: fields to update. |
| `DELETE` | `/api/members/[id]` | Delete member. |

**GET `/api/members`** — Response shape:
```json
[
  {
    "id": "cuid...",
    "name": "Bagmati Hall",
    "slug": "bagmati-hall",
    "area": "Teku",
    "capacity": 500,
    "type": "banquet",
    "phone": "9851234567",
    "featured": true,
    "image": "/uploads/1234-bagmati.jpg"
  }
]
```

**POST `/api/members`** — Request body:
```json
{
  "name": "New Venue",
  "slug": "new-venue",
  "area": "Lalitpur",
  "capacity": 200,
  "type": "banquet",
  "phone": "9800000000",
  "amenities": ["parking", "catering"],
  "featured": false
}
```

---

### Events

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/events` | List all events. |
| `POST` | `/api/events` | Create event. |
| `GET` | `/api/events/[id]` | Get single event. |
| `PUT` | `/api/events/[id]` | Update event. |
| `DELETE` | `/api/events/[id]` | Delete event. |

**POST `/api/events`** — Request body:
```json
{
  "slug": "networking-2025",
  "title": "Annual Networking Meet",
  "description": "...",
  "date": "2025-06-15T10:00:00.000Z",
  "location": "Hotel Yak & Yeti, Kathmandu",
  "type": "networking",
  "status": "upcoming"
}
```

`type` values: `networking | training | meeting | exhibition | conference`
`status` values: `upcoming | past`

---

### News

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/news` | List all news articles. |
| `POST` | `/api/news` | Create article. |
| `GET` | `/api/news/[id]` | Get single article. |
| `PUT` | `/api/news/[id]` | Update article. |
| `DELETE` | `/api/news/[id]` | Delete article. |

**POST `/api/news`** — Request body:
```json
{
  "slug": "eva-nepal-2025-update",
  "title": "EVA Nepal 2025 Update",
  "excerpt": "Short summary...",
  "content": "Full article text...",
  "author": "EVA Nepal Secretariat",
  "category": "announcement",
  "publishedAt": "2025-03-11T00:00:00.000Z",
  "featured": false
}
```

`category` values: `announcement | training | event | industry | member`

---

### Committee

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/committee` | List all committee members (ordered by `order` field). |
| `POST` | `/api/committee` | Add committee member. |
| `GET` | `/api/committee/[id]` | Get single member. |
| `PUT` | `/api/committee/[id]` | Update member. |
| `DELETE` | `/api/committee/[id]` | Delete member. |

---

### Image Upload

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/upload` | Upload image file. Multipart form data. |

**Request**: `multipart/form-data` with field `file` (image file).

**Response**:
```json
{ "url": "/uploads/1710000000000-venue.jpg" }
```

Files are saved to `/public/uploads/`. The returned URL is stored in the DB `image` field and served directly by Next.js.

---

## Authentication

### How It Works

- **NextAuth v4** with JWT session strategy
- Login page: `/admin/login`
- Session stored in an HTTP-only cookie (`next-auth.session-token`)
- All `/admin/dashboard/*`, `/admin/members/*`, `/admin/events/*`, `/admin/news/*`, `/admin/committee/*` routes are protected by `middleware.ts`

### Login (Credentials)

```
POST /api/auth/callback/credentials
Body: { email, password, csrfToken }
```

Done via NextAuth's `signIn("credentials", { email, password })` on the client — no manual fetch needed.

### Session Check (Server Components)

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
if (!session) redirect("/admin/login");
```

### Session Check (Client Components)

```ts
import { useSession } from "next-auth/react";
const { data: session, status } = useSession();
```

### Sign Out

```ts
import { signOut } from "next-auth/react";
signOut({ callbackUrl: "/admin/login" });
```

---

## Migrations

```bash
# Create a new migration after changing schema.prisma
npx prisma migrate dev --name <description>

# Apply migrations in production (no schema changes, no prompt)
npx prisma migrate deploy

# Reset DB and re-seed (DESTROYS ALL DATA — dev only)
npx prisma migrate reset
```

---

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| `url is not supported in schema.prisma` | Prisma v7 breaking change | Set `url` in `prisma.config.ts` datasource, not in `schema.prisma` |
| `role "postgres" does not exist` | macOS has no `postgres` system user | Use your macOS username (e.g. `sanatmool`) in DATABASE_URL |
| `PrismaPg is not a constructor` | Missing driver adapter | Install `@prisma/adapter-pg` and `pg` |
| Seed fails with duplicate key | Generated member slugs collide | Seed script deduplicates automatically with suffix `-2`, `-3` etc. |
| `NEXTAUTH_SECRET` missing | Not set in .env.local | Run `openssl rand -base64 32` and paste into `.env.local` |
