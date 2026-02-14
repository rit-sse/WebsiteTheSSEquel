import type { Access, AccessArgs } from "payload";

async function checkOfficerAccess({ req }: AccessArgs): Promise<boolean> {
  const userEmail = typeof req.user?.email === "string" ? req.user.email : null;

  if (!userEmail) {
    return false;
  }

  const prismaModule = await import("../../lib/prisma.ts");
  const officer = await prismaModule.default.officer.findFirst({
    where: {
      is_active: true,
      user: {
        email: userEmail,
      },
    },
    select: { id: true },
  });

  return Boolean(officer);
}

export const isOfficer: Access = checkOfficerAccess;
