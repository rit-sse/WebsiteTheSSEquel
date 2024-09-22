import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
	const id = parseInt(params.id);
	const project = await prisma.project.findUnique({
		where: {
			id: id,
		},
	});

	if (project === null) {
		return new Response(`project of id ${id} doesn't exist`);
	}

	return Response.json(project, { status: 201 });
}
