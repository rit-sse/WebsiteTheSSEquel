import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/officer/active
 * Gets all active officers
 * @returns [{is_active: boolean, id: string, start_date: date, end_date: date,
 *            user: {id: string, name: string, email: string},
 *            position: {is_primary: boolean, title: string}}]
 */
export async function GET() {
  const officer = await prisma.alumni.findMany({
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
    },
  });
  return Response.json(officer);
}
