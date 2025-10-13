import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/alumni/active
 * Gets all active alumni
 * @returns [{is_active: boolean, id: string, start_date: date, end_date: date,
 *            user: {id: string, name: string, email: string},
 */
export async function GET() {
  const alumni = await prisma.alumni.findMany({
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
    },
  });
  return Response.json(alumni);
}
