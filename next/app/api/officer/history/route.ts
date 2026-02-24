import prisma from "@/lib/prisma";
import { resolveUserImage } from "@/lib/s3Utils";

export const dynamic = "force-dynamic";

/**
 * Derive the academic year label from a date.
 * Aug–Dec → "YYYY–(YY+1)" (fall start), Jan–Jul → "(YYYY-1)–YY" (spring)
 */
function academicYear(date: Date): string {
  const m = date.getMonth(); // 0-indexed
  const y = date.getFullYear();
  if (m >= 7) {
    // Aug (7) through Dec (11)
    return `${y}\u2013${String(y + 1).slice(2)}`;
  }
  // Jan (0) through Jul (6)
  return `${y - 1}\u2013${String(y).slice(2)}`;
}

/**
 * GET /api/officer/history
 * Returns all non-active officers grouped by academic year (most recent first).
 * Each year entry contains primary officers and committee heads.
 */
export async function GET() {
  const officers = await prisma.officer.findMany({
    where: { is_active: false },
    select: {
      id: true,
      start_date: true,
      end_date: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          linkedIn: true,
          gitHub: true,
          description: true,
          profileImageKey: true,
          googleImageURL: true,
        },
      },
      position: {
        select: {
          id: true,
          title: true,
          is_primary: true,
          is_defunct: true,
        },
      },
    },
    orderBy: { start_date: "desc" },
  });

  // Group by academic year
  const yearMap = new Map<
    string,
    {
      primary_officers: typeof officers;
      committee_heads: typeof officers;
    }
  >();

  for (const officer of officers) {
    const year = academicYear(new Date(officer.start_date));
    if (!yearMap.has(year)) {
      yearMap.set(year, { primary_officers: [], committee_heads: [] });
    }
    const group = yearMap.get(year)!;
    if (officer.position.is_primary) {
      group.primary_officers.push(officer);
    } else {
      group.committee_heads.push(officer);
    }
  }

  // Resolve images and convert to array sorted by year descending
  const years = Array.from(yearMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, groups]) => ({
      year,
      primary_officers: groups.primary_officers.map((o) => ({
        ...o,
        user: {
          ...o.user,
          image: resolveUserImage(o.user.profileImageKey, o.user.googleImageURL),
        },
      })),
      committee_heads: groups.committee_heads
        .sort((a, b) => a.position.title.localeCompare(b.position.title))
        .map((o) => ({
          ...o,
          user: {
            ...o.user,
            image: resolveUserImage(o.user.profileImageKey, o.user.googleImageURL),
          },
        })),
    }));

  return Response.json(years);
}
