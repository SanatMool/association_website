-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add_multi_tenancy_association_platform
-- Adds: Association, MemberAssociation, TimelineEntry, PlatformUser, ApiLog
-- Modifies: Member, Event, News, CommitteeMember, AdminUser, SiteSettings, AdminTask
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Association (tenant record) ───────────────────────────────────────────

CREATE TABLE "Association" (
    "id"            TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "nameNe"        TEXT,
    "slug"          TEXT NOT NULL,
    "domain"        TEXT NOT NULL,
    "logo"          TEXT,
    "themeColor"    TEXT NOT NULL DEFAULT '#0a1040',
    "accentColor"   TEXT NOT NULL DEFAULT '#f59e0b',
    "foundedYear"   INTEGER,
    "description"   TEXT,
    "descriptionNe" TEXT,
    "active"        BOOLEAN NOT NULL DEFAULT true,
    "plan"          TEXT NOT NULL DEFAULT 'basic',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Association_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Association_slug_key" ON "Association"("slug");
CREATE UNIQUE INDEX "Association_domain_key" ON "Association"("domain");

-- ── 2. MemberAssociation (many-to-many with visibility control) ──────────────

CREATE TABLE "MemberAssociation" (
    "id"            TEXT NOT NULL,
    "memberId"      TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "visible"       BOOLEAN NOT NULL DEFAULT true,
    "primary"       BOOLEAN NOT NULL DEFAULT true,
    "joinedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberAssociation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MemberAssociation_memberId_associationId_key"
    ON "MemberAssociation"("memberId", "associationId");

ALTER TABLE "MemberAssociation"
    ADD CONSTRAINT "MemberAssociation_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemberAssociation"
    ADD CONSTRAINT "MemberAssociation_associationId_fkey"
    FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 3. TimelineEntry (per-association history milestones) ────────────────────

CREATE TABLE "TimelineEntry" (
    "id"            TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "year"          INTEGER NOT NULL,
    "title"         TEXT NOT NULL,
    "titleNe"       TEXT,
    "description"   TEXT NOT NULL,
    "descriptionNe" TEXT,
    "stat"          TEXT,
    "highlighted"   BOOLEAN NOT NULL DEFAULT false,
    "order"         INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TimelineEntry"
    ADD CONSTRAINT "TimelineEntry_associationId_fkey"
    FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 4. PlatformUser (nibjar software provider login) ─────────────────────────

CREATE TABLE "PlatformUser" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "password"  TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformUser_email_key" ON "PlatformUser"("email");

-- ── 5. ApiLog (API usage + error tracking per association) ───────────────────

CREATE TABLE "ApiLog" (
    "id"             TEXT NOT NULL,
    "associationId"  TEXT,
    "path"           TEXT NOT NULL,
    "method"         TEXT NOT NULL,
    "statusCode"     INTEGER NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "adminUserId"    TEXT,
    "ip"             TEXT,
    "errorMessage"   TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ApiLog"
    ADD CONSTRAINT "ApiLog_associationId_fkey"
    FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 6. Member — add new fields, make capacity/type/phone nullable ─────────────

ALTER TABLE "Member"
    ALTER COLUMN "capacity" DROP NOT NULL,
    ALTER COLUMN "type"     DROP NOT NULL,
    ALTER COLUMN "phone"    DROP NOT NULL;

ALTER TABLE "Member"
    ADD COLUMN "nameNe"      TEXT,
    ADD COLUMN "ownerName"   TEXT,
    ADD COLUMN "ownerNameNe" TEXT,
    ADD COLUMN "addressNe"   TEXT,
    ADD COLUMN "active"      BOOLEAN NOT NULL DEFAULT true;

-- ── 7. Event — add associationId ─────────────────────────────────────────────

ALTER TABLE "Event"
    ADD COLUMN "associationId" TEXT;

ALTER TABLE "Event"
    ADD CONSTRAINT "Event_associationId_fkey"
    FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 8. News — add associationId + createdAt ──────────────────────────────────

ALTER TABLE "News"
    ADD COLUMN "associationId" TEXT,
    ADD COLUMN "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "News"
    ADD CONSTRAINT "News_associationId_fkey"
    FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 9. CommitteeMember — add associationId ───────────────────────────────────

ALTER TABLE "CommitteeMember"
    ADD COLUMN "associationId" TEXT;

ALTER TABLE "CommitteeMember"
    ADD CONSTRAINT "CommitteeMember_associationId_fkey"
    FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 10. AdminUser — add associationId ────────────────────────────────────────

ALTER TABLE "AdminUser"
    ADD COLUMN "associationId" TEXT;

ALTER TABLE "AdminUser"
    ADD CONSTRAINT "AdminUser_associationId_fkey"
    FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 11. SiteSettings — add associationId, replace unique index ───────────────

ALTER TABLE "SiteSettings"
    ADD COLUMN "associationId" TEXT;

-- Drop the old global unique index on key alone
DROP INDEX "SiteSettings_key_key";

-- New composite unique: same key can exist for different associations
CREATE UNIQUE INDEX "SiteSettings_key_associationId_key"
    ON "SiteSettings"("key", "associationId");

ALTER TABLE "SiteSettings"
    ADD CONSTRAINT "SiteSettings_associationId_fkey"
    FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── 12. AdminTask — add associationId ────────────────────────────────────────

ALTER TABLE "AdminTask"
    ADD COLUMN "associationId" TEXT;
