import prisma from "@/lib/prisma";
import { resolveUserImage } from "@/lib/s3Utils";

export const dynamic = "force-dynamic";

/**
 * HTTP GET request to /api/officer/active
 * Gets all active officers
 * @returns [{is_active: boolean, id: string, start_date: date, end_date: date,
 *            user: {id: string, name: string, email: string},
 *            position: {is_primary: boolean, title: string}}]
 */
export async function GET() {
  const officer = await prisma.officer.findMany({
    where: { is_active: true },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          linkedIn: true,
          profileImageKey: true,
          googleImageURL: true,
          gitHub: true,
          description: true
        },
      },
      position: {
        select: {
          is_primary: true,
          title: true,
        },
      },
    },
  });

  // Transform to include resolved image URL
  const officersWithImage = officer.map((o: typeof officer[number]) => ({
    ...o,
    user: {
      ...o.user,
      image: resolveUserImage(o.user.profileImageKey, o.user.googleImageURL),
    },
  }));

  return Response.json(officersWithImage);
}
