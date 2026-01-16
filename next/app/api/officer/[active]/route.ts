import prisma from "@/lib/prisma";

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
          image: true,
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
  return Response.json(officer);
}
