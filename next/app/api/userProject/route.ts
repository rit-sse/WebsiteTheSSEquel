import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request: Request) {
	const userProjects = await prisma.userProject.findMany({
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
	return Response.json(userProjects, { status: 200 });
}

export async function POST(request: Request) {
	let body: { userId: number; projectId: number };
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 422 });
	}

	if (!("userId" in body) || !("projectId" in body)) {
		return new Response("'userId' and 'projectId' must be included in the body", {
			status: 400,
		});
	}

	if (typeof body.userId != "number") {
		return new Response("'userId' must be a number", { status: 422 });
	}
	if (typeof body.projectId != "number") {
		return new Response("'projectId' must be a number", { status: 422 });
	}

	const userProject = await prisma.userProject.create({
		data: {
			userId: body.userId,
			projectId: body.projectId,
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
	return Response.json(userProject, { status: 201 });
}

export async function PUT(request: Request) {
	let body: { id: number; userId?: number; projectId?: number };
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 422 });
	}

	if (!("id" in body)) {
		return new Response("'id' must be included in the body", {
			status: 400,
		});
	}
	if (typeof body.id != "number") {
		return new Response("'id' must be a number", { status: 422 });
	}

	const userProjectExists =
		(await prisma.userProject.findUnique({
			where: {
				id: body.id,
			},
		})) != null;
	if (!userProjectExists) {
		return new Response(`userProject with 'id' ${body.id} doesn't exist`, { status: 404 });
	}

	let data: { userId?: number; projectId?: number } = {};
	if ("userId" in body) {
		if (typeof body.userId != "number") {
			return new Response("'userId' must be a number", { status: 422 });
		}
		data.userId = body.userId;
	}
	if ("projectId" in body) {
		if (typeof body.projectId != "number") {
			return new Response("'projectId' must be a number", { status: 422 });
		}
		data.projectId = body.projectId;
	}

	const userProject = await prisma.userProject.update({
		where: {
			id: body.id,
		},
		data,
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
	return Response.json(userProject, { status: 200 });
}

export async function DELETE(request: Request) {
	let body: { id: number };
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 422 });
	}

	if (!("id" in body)) {
		return new Response("'id' must be included in the body");
	}

	const userProjectExists =
		(await prisma.userProject.findUnique({
			where: {
				id: body.id,
			},
		})) != null;

	if (!userProjectExists) {
		return new Response(`userProject with 'id' ${body.id} doesn't exist`);
	}

	const userProject = await prisma.userProject.delete({
		where: {
			id: body.id,
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
	return Response.json(userProject, { status: 200 });
}