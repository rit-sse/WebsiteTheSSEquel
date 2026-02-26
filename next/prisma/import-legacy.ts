/**
 * Legacy Data Import Script
 *
 * Imports ~10 years of SSE data (2015-2025) from an old Sequelize/Postgres
 * SQL dump file directly into the new Prisma schema.
 *
 * Officer titles are normalized so legacy variations (e.g. "Events",
 * "Events Head", "PR", "Public Relations") all map to a single canonical
 * position.  Positions that no longer exist in the current org are created
 * with is_defunct = true so they appear in historical views but not as
 * fillable current positions.
 *
 * Run:
 *   cd next
 *   ts-node --compiler-options '{"module":"CommonJS"}' \
 *     prisma/import-legacy.ts ~/Downloads/postgres-2025-04-09.sql
 */

import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Resolve dump file path ──────────────────────────────────

const dumpArg = process.argv[2];
if (!dumpArg) {
  console.error("Usage: ts-node prisma/import-legacy.ts <path-to-dump.sql>");
  process.exit(1);
}
const DUMP_PATH = dumpArg.startsWith("~")
  ? path.join(process.env.HOME ?? "", dumpArg.slice(1))
  : path.resolve(dumpArg);

if (!fs.existsSync(DUMP_PATH)) {
  console.error(`ERROR: Dump file not found: ${DUMP_PATH}`);
  process.exit(1);
}

// ─── Title normalisation ──────────────────────────────────────
//
// Maps every legacy officer title to a canonical position title.
// Positions that don't exist in the current org are created as
// is_defunct = true.

const TITLE_MAP: Record<string, string> = {
  // ── Primary officers (exist in current system) ──
  "President":            "President",
  "Vice President":       "Vice President",
  "Treasurer":            "Treasurer",
  "Secretary":            "Secretary",

  // ── Committee heads (exist in current system) ──
  "Mentoring Head":       "Mentoring Head",
  "Mentoring":            "Mentoring Head",
  "Career Mentoring":     "Mentoring Head",
  "Mentoring Hours":      "Mentoring Head",

  "Public Relations Head": "Public Relations Head",
  "Public Relations":      "Public Relations Head",
  "PR":                    "Public Relations Head",

  "Projects Head":        "Projects Head",
  "Projects":             "Projects Head",

  "Talks Head":           "Talks Head",
  "Talks":                "Talks Head",

  "Career Development Head": "Career Development Head",
  "Career Development":      "Career Development Head",

  "Marketing Head":       "Marketing Head",
  "Marketing":            "Marketing Head",

  // ── Active committee heads (exist in current system) ──
  "Events":                     "Events",
  "Events Head":                "Events",

  "Laboratory Operations":      "Laboratory Operations",
  "Laboratory Operations Head": "Laboratory Operations",
  "Lab Operations":             "Laboratory Operations",
  "Lab Operations Head":        "Laboratory Operations",
  "Lab Ops":                    "Laboratory Operations",

  "Tech Head":            "Tech Head",
  "Technology":           "Tech Head",
  "Technology Head":      "Tech Head",

  // ── Defunct positions (no longer in current org) ──
  "Tech Head Apprentice": "Tech Head Apprentice",

  "Historian":            "Historian",
  "Historian Head":       "Historian",

  "Branding Head":        "Branding Head",

  "Outreach":             "Student Outreach Head",
  "Student Outreach":     "Student Outreach Head",
  "Student Outreach Head":"Student Outreach Head",

  "Review Sessions":      "Review Sessions Head",

  "Spring Fling":         "Spring Fling Head",

  "Winter Ball":          "Winterball Head",
  "Winterball Head":      "Winterball Head",
};

/** Canonical titles that should be marked is_defunct */
const DEFUNCT_TITLES = new Set([
  "Tech Head Apprentice",
  "Historian",
  "Branding Head",
  "Student Outreach Head",
  "Review Sessions Head",
  "Spring Fling Head",
  "Winterball Head",
]);

// ─── Dump file parser ─────────────────────────────────────────

function unescapeCopy(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\");
}

type Row = Record<string, string | null>;

function parseDump(filePath: string): Map<string, Row[]> {
  const result = new Map<string, Row[]>();
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trimEnd();
    const match = line.match(/^COPY public\.(\w+)\s+\(([^)]+)\)\s+FROM stdin;$/);
    if (match) {
      const tableName = match[1];
      const columns = match[2]
        .split(",")
        .map((c) => c.trim().replace(/^"(.+)"$/, "$1"));

      i++;
      const rows: Row[] = [];
      while (i < lines.length && lines[i].trimEnd() !== "\\.") {
        const rawLine = lines[i];
        if (rawLine.trim() === "") { i++; continue; }
        const values = rawLine.split("\t");
        const row: Row = {};
        columns.forEach((col, idx) => {
          const raw = values[idx] ?? "";
          row[col] = raw === "\\N" ? null : unescapeCopy(raw);
        });
        rows.push(row);
        i++;
      }
      result.set(tableName, rows);
    }
    i++;
  }
  return result;
}

// ─── Type coercions ───────────────────────────────────────────

function toBool(v: string | null): boolean | null {
  if (v === "t" || v === "true") return true;
  if (v === "f" || v === "false") return false;
  return null;
}

function toDate(v: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Helpers ──────────────────────────────────────────────────

function buildName(firstName: string | null, lastName: string | null, dce: string): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : dce;
}

function dceToEmail(dce: string): string {
  return `${dce}@g.rit.edu`;
}

function estimateEndDate(startDate: Date): Date {
  const month = startDate.getMonth();
  const year = startDate.getFullYear();
  return month >= 7 ? new Date(year + 1, 4, 15) : new Date(year, 4, 15);
}

// ─── Cleanup ──────────────────────────────────────────────────

/**
 * Remove previously imported historical officers and defunct positions
 * so we can re-import cleanly.
 */
async function cleanupPreviousImport() {
  console.log("\n═══ Cleaning up previous import ═══");

  // Delete all inactive (historical) officers
  const { count: deletedOfficers } = await prisma.officer.deleteMany({
    where: { is_active: false },
  });
  console.log(`  Deleted ${deletedOfficers} historical officer records`);

  // Delete defunct positions (they have no active officers, and historical
  // ones were just removed above)
  const { count: deletedPositions } = await prisma.officerPosition.deleteMany({
    where: { is_defunct: true },
  });
  console.log(`  Deleted ${deletedPositions} defunct positions`);

  // Also delete any import-created positions that have no officers left
  // (identified by not having a proper @rit.edu email)
  const orphanedPositions = await prisma.officerPosition.findMany({
    where: {
      officers: { none: {} },
      NOT: { email: { contains: "@rit.edu" } },
    },
  });
  if (orphanedPositions.length > 0) {
    // Must delete associated handover docs first due to cascade
    for (const pos of orphanedPositions) {
      await prisma.handoverDocument.deleteMany({ where: { positionId: pos.id } });
    }
    const { count } = await prisma.officerPosition.deleteMany({
      where: { id: { in: orphanedPositions.map((p) => p.id) } },
    });
    console.log(`  Deleted ${count} orphaned import positions`);
  }
}

// ─── Import functions ─────────────────────────────────────────

async function importUsers(db: Map<string, Row[]>) {
  console.log("\n═══ Importing Users ═══");
  const rows = db.get("users") ?? [];
  console.log(`  Found ${rows.length} legacy users`);

  let created = 0, skipped = 0;
  for (const u of rows) {
    const email = dceToEmail(u.dce!);
    const name = buildName(u.firstName, u.lastName, u.dce!);
    try {
      await prisma.user.upsert({
        where: { email },
        create: { email, name, isImported: true },
        update: {},
      });
      created++;
    } catch (err: any) {
      console.warn(`  WARN: Failed to import user ${u.dce}: ${err.message}`);
      skipped++;
    }
  }
  console.log(`  Created/found: ${created}, Skipped: ${skipped}`);
}

async function importEvents(db: Map<string, Row[]>) {
  console.log("\n═══ Importing Events ═══");
  const rows = db.get("events") ?? [];
  console.log(`  Found ${rows.length} legacy events`);

  let created = 0, skipped = 0;
  for (const e of rows) {
    const eventId = `legacy-${e.id}`;
    try {
      await prisma.event.upsert({
        where: { id: eventId },
        create: {
          id: eventId,
          title: e.name ?? "Untitled Event",
          date: toDate(e.startDate) ?? new Date(),
          endDate: toDate(e.endDate),
          description: e.description ?? "",
          location: e.location || null,
          image: e.image || null,
          attendanceEnabled: false,
          grantsMembership: false,
        },
        update: {},
      });
      created++;
    } catch (err: any) {
      console.warn(`  WARN: Failed to import event ${e.id} "${e.name}": ${err.message}`);
      skipped++;
    }
  }
  console.log(`  Created/found: ${created}, Skipped: ${skipped}`);
}

async function importGoLinks(db: Map<string, Row[]>) {
  console.log("\n═══ Importing GoLinks ═══");
  const rows = db.get("links") ?? [];
  console.log(`  Found ${rows.length} legacy links`);

  let created = 0, skipped = 0;
  for (const l of rows) {
    try {
      const existing = await prisma.goLinks.findFirst({
        where: { golink: l.shortLink! },
      });
      if (existing) { skipped++; continue; }

      await prisma.goLinks.create({
        data: {
          golink: l.shortLink!,
          url: l.longLink!,
          description: l.description || null,
          isPublic: toBool(l.public) ?? false,
          isPinned: false,
          createdAt: toDate(l.createdAt) ?? new Date(),
          updatedAt: toDate(l.updatedAt) ?? new Date(),
        },
      });
      created++;
    } catch (err: any) {
      console.warn(`  WARN: Failed to import link "${l.shortLink}": ${err.message}`);
      skipped++;
    }
  }
  console.log(`  Created: ${created}, Skipped (existing): ${skipped}`);
}

async function importQuotes(db: Map<string, Row[]>) {
  console.log("\n═══ Importing Quotes ═══");
  const rows = (db.get("quotes") ?? []).filter((q) => toBool(q.approved) === true);
  console.log(`  Found ${rows.length} approved legacy quotes`);

  let created = 0, skipped = 0;
  for (const q of rows) {
    try {
      const body = q.body ?? "";
      const quoteText = body.length > 255 ? body.substring(0, 252) + "..." : body;
      const author = q.description || "Anonymous";
      const dateAdded = toDate(q.createdAt) ?? new Date();

      // Skip if an identical quote already exists (idempotent)
      const existing = await prisma.quote.findFirst({
        where: { quote: quoteText, date_added: dateAdded },
      });
      if (existing) { skipped++; continue; }

      await prisma.quote.create({
        data: {
          date_added: dateAdded,
          quote: quoteText,
          author,
          user_id: null,
        },
      });
      created++;
    } catch (err: any) {
      console.warn(`  WARN: Failed to import quote ${q.id}: ${err.message}`);
      skipped++;
    }
  }
  console.log(`  Created: ${created}, Skipped: ${skipped}`);
}

async function importOfficers(db: Map<string, Row[]>) {
  console.log("\n═══ Importing Officers ═══");
  const rows = db.get("officers") ?? [];
  console.log(`  Found ${rows.length} legacy officer records`);

  // Step 1: Collect canonical position info from the dump
  // Use the FIRST email seen for each canonical title as the default.
  const canonicalInfo = new Map<string, { email: string; isPrimary: boolean }>();
  let unmapped = 0;
  for (const o of rows) {
    const rawTitle = o.title!;
    const canonical = TITLE_MAP[rawTitle];
    if (!canonical) {
      console.warn(`  WARN: Unmapped title "${rawTitle}" — skipping officer ${o.userDce}`);
      unmapped++;
      continue;
    }
    if (!canonicalInfo.has(canonical)) {
      canonicalInfo.set(canonical, {
        email: o.email ?? `${canonical.toLowerCase().replace(/\s+/g, "-")}@sse.rit.edu`,
        isPrimary: toBool(o.primaryOfficer) ?? false,
      });
    }
  }
  if (unmapped > 0) console.warn(`  ${unmapped} officers with unmapped titles skipped`);

  // Step 2: Upsert canonical positions
  let positionsCreated = 0, positionsExisting = 0;
  for (const [title, info] of canonicalInfo) {
    try {
      const existing = await prisma.officerPosition.findUnique({ where: { title } });
      if (existing) {
        // Mark defunct flag correctly if needed
        if (DEFUNCT_TITLES.has(title) && !existing.is_defunct) {
          await prisma.officerPosition.update({
            where: { id: existing.id },
            data: { is_defunct: true },
          });
        }
        positionsExisting++;
        continue;
      }

      // Avoid email collisions
      const emailConflict = await prisma.officerPosition.findUnique({
        where: { email: info.email },
      });
      const email = emailConflict
        ? `legacy-${title.toLowerCase().replace(/\s+/g, "-")}@sse.rit.edu`
        : info.email;

      await prisma.officerPosition.create({
        data: {
          title,
          email,
          is_primary: info.isPrimary,
          is_defunct: DEFUNCT_TITLES.has(title),
        },
      });
      positionsCreated++;
    } catch (err: any) {
      console.warn(`  WARN: Failed to create position "${title}": ${err.message}`);
    }
  }
  console.log(`  Positions — Created: ${positionsCreated}, Already existing: ${positionsExisting}`);

  // Step 3: Import officer assignments using normalized titles
  let officersCreated = 0, officersSkipped = 0;
  for (const o of rows) {
    const rawTitle = o.title!;
    const canonical = TITLE_MAP[rawTitle];
    if (!canonical) { officersSkipped++; continue; }

    const email = dceToEmail(o.userDce!);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.warn(`  WARN: No user for officer ${o.userDce} (${rawTitle}→${canonical}), skipping`);
      officersSkipped++;
      continue;
    }

    const position = await prisma.officerPosition.findUnique({ where: { title: canonical } });
    if (!position) {
      console.warn(`  WARN: No position for canonical title "${canonical}", skipping`);
      officersSkipped++;
      continue;
    }

    const startDate = toDate(o.startDate) ?? new Date();
    const endDate = toDate(o.endDate) ?? estimateEndDate(startDate);

    try {
      // Skip duplicates (same user, position, start date)
      const existing = await prisma.officer.findFirst({
        where: {
          user_id: user.id,
          position_id: position.id,
          start_date: startDate,
        },
      });
      if (existing) { officersSkipped++; continue; }

      await prisma.officer.create({
        data: {
          position_id: position.id,
          user_id: user.id,
          is_active: false,
          start_date: startDate,
          end_date: endDate,
        },
      });
      officersCreated++;
    } catch (err: any) {
      console.warn(`  WARN: Failed to import officer ${o.userDce} as ${canonical}: ${err.message}`);
      officersSkipped++;
    }
  }
  console.log(`  Officers — Created: ${officersCreated}, Skipped: ${officersSkipped}`);
}

async function importMemberships(db: Map<string, Row[]>) {
  console.log("\n═══ Importing Memberships ═══");
  const rows = (db.get("memberships") ?? []).filter((m) => toBool(m.approved) === true);
  console.log(`  Found ${rows.length} approved legacy memberships`);

  let created = 0, skipped = 0;
  for (const m of rows) {
    const email = dceToEmail(m.userDce!);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { skipped++; continue; }

    const dateGiven = toDate(m.startDate) ?? new Date();
    try {
      const existing = await prisma.memberships.findFirst({
        where: { userId: user.id, reason: m.reason ?? "", dateGiven },
      });
      if (existing) { skipped++; continue; }

      await prisma.memberships.create({
        data: {
          userId: user.id,
          reason: m.reason ?? "Legacy membership",
          dateGiven,
        },
      });
      created++;
    } catch (err: any) {
      console.warn(`  WARN: Failed to import membership for ${m.userDce}: ${err.message}`);
      skipped++;
    }
  }
  console.log(`  Created: ${created}, Skipped: ${skipped}`);
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  SSE Legacy Data Import  (v2 – normalized)  ║");
  console.log("║  Parsing dump file → Prisma                 ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`\nDump file: ${DUMP_PATH}`);
  console.log(`Target DB: ${(process.env.DATABASE_URL ?? "").substring(0, 50)}...`);

  console.log("\nParsing dump file...");
  const db = parseDump(DUMP_PATH);
  console.log(`  Parsed tables: ${Array.from(db.keys()).join(", ")}`);

  const startTime = Date.now();

  // Clean up the previous import's officer data
  await cleanupPreviousImport();

  // Re-import everything (idempotent for users/events/links/quotes/memberships)
  await importUsers(db);
  await importEvents(db);
  await importGoLinks(db);
  await importQuotes(db);
  await importOfficers(db);
  await importMemberships(db);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n══════════════════════════════════════════`);
  console.log(`Import complete in ${elapsed}s`);

  const [userCount, eventCount, goLinkCount, quoteCount, officerCount, membershipCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.goLinks.count(),
      prisma.quote.count(),
      prisma.officer.count(),
      prisma.memberships.count(),
    ]);

  console.log("\nFinal record counts in new DB:");
  console.log(`  Users:       ${userCount}`);
  console.log(`  Events:      ${eventCount}`);
  console.log(`  GoLinks:     ${goLinkCount}`);
  console.log(`  Quotes:      ${quoteCount}`);
  console.log(`  Officers:    ${officerCount}`);
  console.log(`  Memberships: ${membershipCount}`);

  // Show position breakdown
  const positions = await prisma.officerPosition.findMany({
    orderBy: { title: "asc" },
    include: { officers: { where: { is_active: false }, select: { id: true } } },
  });
  console.log("\nOfficer positions:");
  for (const p of positions) {
    const tag = p.is_defunct ? " [DEFUNCT]" : "";
    console.log(`  ${p.title.padEnd(28)} ${String(p.officers.length).padStart(3)} historical officers${tag}`);
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
