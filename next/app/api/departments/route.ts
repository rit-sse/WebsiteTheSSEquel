import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const allDepts = await prisma.department.findMany({
    select: {
      title: true,
      shortTitle: true,
      course: {
        select: {
          title: true,
          code: true,
        },
      },
    },
  });
  console.log("All Departments:", allDepts);
  return Response.json(allDepts);
}

export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Validate the titles
  const title = body.title;
  const shortTitle = body.shortTitle;
  await prisma.department.create({
    data: {
      title,
      shortTitle,
    },
  });
  return new Response(`Created new department: ${title}`, { status: 200 });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const id = body.id;
  // TODO: Validate the id
  await prisma.department.delete({ where: { id } });
  return new Response("Deleted department", { status: 200 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  // TODO: Validate input
  const id = body.id;
  const title = body.title;
  const shortTitle = body.shortTitle;
  await prisma.department.update({
    where: { id },
    data: { title, shortTitle },
  });
  return new Response("Updated department", { status: 200 });
}
