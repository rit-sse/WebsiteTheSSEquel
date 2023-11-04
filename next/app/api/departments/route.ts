import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function get_departments() {
  const allDepts = await prisma.department.findMany({
    select: {
      title: true,
      course: {
        select: {
          title: true,
          code: true,
        },
      },
    },
  });
  return allDepts;
}

// async function make_department(title: string) {
//   await prisma.department.create({
//     data: {
//       title,
//     },
//   });
// }

// async function remove_department(id: number) {
//   await prisma.department.delete({ where: { id } });
// }

export async function GET() {
  const allDepts = await get_departments();
  console.log("All Departments:", allDepts);
  return Response.json(allDepts);
}

// export async function POST(request: Request) {
//   const body = await request.json();
//   const title = body.title;
//   await make_department(title);
//   return new Response(`Created new department: ${title}`, { status: 200 });
// }

// export async function DELETE(request: Request) {
//   const body = await request.json();
//   const id = body.id;
//   await remove_department(id);
//   return new Response("Deleted department", { status: 200 });
// }
