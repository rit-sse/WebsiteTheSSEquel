import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const officer = await prisma.officer.findMany({
    where: { is_active: true },
    select: {
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
