import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient();

export async function GET() {
  const officer = await prisma.officer.findMany({
    select: {
      is_active: true,
      start_date: true,
      end_date: true,
      user: {
        select: {
          name: true,
          email: true,
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
