-- ────────────────────────────────────────────────────────────────────
-- Page builder + dynamic content
--
-- Adds officer-editable Pages, version snapshots, a managed
-- PhotoCategory table (promoted from Photo.category string), and a
-- NavItem tree that takes over from the hardcoded arrays in
-- components/nav/Navbar.tsx.
--
-- The Photo.category column transitions from a free string to a FK
-- referencing PhotoCategory.slug. We seed the 6 historical built-in
-- categories AND backfill any extra category strings already in the
-- Photo table (typos or manual-seed values) before adding the FK so
-- the constraint never fails.
-- ────────────────────────────────────────────────────────────────────

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NavSection" AS ENUM ('TOP_LEVEL', 'STUDENTS', 'ALUMNI', 'COMPANIES', 'SE_OFFICE', 'HIDDEN');

-- CreateTable
CREATE TABLE "Page" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
    "systemLocked" BOOLEAN NOT NULL DEFAULT false,
    "draftContent" JSONB NOT NULL,
    "publishedContent" JSONB,
    "publishedAt" TIMESTAMP(3),
    "publishedById" INTEGER,
    "seoTitle" VARCHAR(200),
    "seoDescription" VARCHAR(500),
    "showInNav" BOOLEAN NOT NULL DEFAULT false,
    "navSection" "NavSection" NOT NULL DEFAULT 'HIDDEN',
    "navLabel" VARCHAR(80),
    "navOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "archivedById" INTEGER,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");
CREATE INDEX "Page_status_slug_idx" ON "Page"("status", "slug");
CREATE INDEX "Page_archivedAt_idx" ON "Page"("archivedAt");
CREATE INDEX "Page_navSection_navOrder_idx" ON "Page"("navSection", "navOrder");

-- CreateTable
CREATE TABLE "PageVersion" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "contentHash" VARCHAR(64) NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedById" INTEGER,

    CONSTRAINT "PageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageVersion_pageId_version_key" ON "PageVersion"("pageId", "version");
CREATE INDEX "PageVersion_pageId_publishedAt_idx" ON "PageVersion"("pageId", "publishedAt");

-- CreateTable
CREATE TABLE "PhotoCategory" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhotoCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhotoCategory_slug_key" ON "PhotoCategory"("slug");

-- CreateTable
CREATE TABLE "NavItem" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER,
    "label" VARCHAR(80) NOT NULL,
    "href" VARCHAR(500) NOT NULL,
    "description" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "alignment" VARCHAR(10),

    CONSTRAINT "NavItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NavItem_parentId_sortOrder_idx" ON "NavItem"("parentId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Page" ADD CONSTRAINT "Page_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Page" ADD CONSTRAINT "Page_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NavItem" ADD CONSTRAINT "NavItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NavItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ────────────────────────────────────────────────────────────────────
-- Seed the 6 built-in PhotoCategories that match the historical
-- enum values in lib/photos.ts. These cannot be deleted from the
-- dashboard (only renamed) because removing them would silently
-- orphan any Photo rows still referencing them via the FK.
-- ────────────────────────────────────────────────────────────────────
INSERT INTO "PhotoCategory" ("slug", "label", "description", "isBuiltIn", "sortOrder", "updatedAt") VALUES
    ('general',   'General',     'Catch-all for photos that do not fit a more specific category.', true, 0, CURRENT_TIMESTAMP),
    ('events',    'Events',      'Photos from SSE events, talks, and gatherings.',                  true, 1, CURRENT_TIMESTAMP),
    ('projects',  'Projects',    'Project showcases, demos, and work-in-progress shots.',           true, 2, CURRENT_TIMESTAMP),
    ('mentoring', 'Mentoring',   'Mentor sessions, lab activity, and tutoring moments.',            true, 3, CURRENT_TIMESTAMP),
    ('social',    'Social',      'Casual hangouts, parties, and community moments.',                true, 4, CURRENT_TIMESTAMP),
    ('outreach',  'Outreach',    'Imagine RIT, K-12 outreach, recruiting, and external events.',    true, 5, CURRENT_TIMESTAMP);

-- ────────────────────────────────────────────────────────────────────
-- Backfill: any Photo.category value that doesn't already exist in
-- PhotoCategory becomes a non-built-in row. This catches typos and
-- one-off values that landed in the column before this migration.
-- ────────────────────────────────────────────────────────────────────
INSERT INTO "PhotoCategory" ("slug", "label", "description", "isBuiltIn", "sortOrder", "updatedAt")
SELECT DISTINCT
    p."category",
    INITCAP(REPLACE(p."category", '-', ' ')),
    NULL,
    false,
    100,
    CURRENT_TIMESTAMP
FROM "Photo" p
WHERE p."category" NOT IN (SELECT slug FROM "PhotoCategory")
ON CONFLICT (slug) DO NOTHING;

-- AddForeignKey: Photo.category → PhotoCategory.slug
-- ON UPDATE CASCADE means renaming a category propagates with one SQL.
-- ON DELETE RESTRICT means we can never drop a category that still has
-- photos — the dashboard surfaces a "merge into …" picker instead.
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_category_fkey"
    FOREIGN KEY ("category") REFERENCES "PhotoCategory"("slug")
    ON DELETE RESTRICT ON UPDATE CASCADE;
