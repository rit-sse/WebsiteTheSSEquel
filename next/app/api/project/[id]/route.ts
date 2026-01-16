import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
	const id = parseInt(params.id);

	if (typeof id != "number") {
		return new Response("id must be an integer", { status: 402 });
	}

	const project = await prisma.project.findUnique({
		where: {
			id,
		},
	});

	if (project === null) {
		return new Response(`project of 'id' ${id} doesn't exist`);
	}

	return Response.json(project, { status: 200 });
}
