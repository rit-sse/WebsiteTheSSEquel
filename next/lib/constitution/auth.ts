import prisma from "@/lib/prisma";
import { getGatewayAuthLevel } from "@/lib/authGateway";
import { getSessionTokenFromRequest } from "@/lib/authLevelResolver";

export async function getConstitutionActorFromRequest(request: Request) {
  const authLevel = await getGatewayAuthLevel(request);
  const token = getSessionTokenFromRequest(request);
  const user = token
    ? await prisma.user.findFirst({
        where: {
          session: {
            some: {
              sessionToken: token,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })
    : null;

  return {
    authLevel,
    user,
  };
}

export async function getViewerPrimaryOfficerSlots(userId: number | null) {
  if (!userId) {
    return [];
  }

  const officerSlots = await prisma.officer.findMany({
    where: {
      user_id: userId,
      is_active: true,
      position: {
        is_primary: true,
      },
    },
    select: {
      id: true,
      position: {
        select: {
          title: true,
        },
      },
    },
    orderBy: [{ position: { title: "asc" } }, { id: "asc" }],
  });

  return officerSlots.map((slot) => ({
    id: slot.id,
    positionTitle: slot.position.title,
  }));
}
