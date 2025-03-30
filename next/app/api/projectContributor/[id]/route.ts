import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);

  if (typeof id != "number") {
    return new Response("id must be an integer", { status: 402 });
  }

  const projectContributor = await prisma.projectContributor.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          title: true,
          description: true,
          repoLink: true,
          contentURL: true,
        },
      },
    },
  });

  if (projectContributor === null) {
    return new Response(`project of 'id' ${id} doesn't exist`);
  }

  return Response.json(projectContributor, { status: 200 });
}
