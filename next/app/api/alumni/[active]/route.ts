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
  const alumni = await prisma.alumni.findMany({
    select: {
      quote: true,
      previous_roles: true,
      id: true,
      start_date: true,
      end_date: true,
      name: true,
      email: true,
      linkedIn: true,
      image: true,
      gitHub: true,
      description: true,
      showEmail: true,
    },
  });
  return Response.json(alumni);
}
