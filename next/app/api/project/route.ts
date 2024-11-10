import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request: Request) {
	const projects = await prisma.project.findMany();
	return Response.json(projects);
}

export async function POST(request: Request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 422 });
	}

	if (!("title" in body && "description" in body)) {
		return new Response("'title' and 'description' must be included in the body", {
			status: 400,
		});
	}

	let repoLink = "";
	let contentURL = "";
	if ("repoLink" in body) {
		repoLink = body.repoLink;
	}
	if ("contentURL" in body) {
		contentURL = body.contentURL;
	}

	const project = await prisma.project.create({
		data: {
			title: body.title,
			description: body.description,
			repoLink,
			contentURL,
		},
	});
	return Response.json(project, { status: 201 });
}

export async function PUT(request: Request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 422 });
	}

	if (!("id" in body)) {
		return new Response("'id' must be included in the body", { status: 400 });
	}

	const project_exists =
		(await prisma.project.findUnique({
			where: { id: body.id },
		})) !== null;

	if (!project_exists) {
		return new Response(`project of id: ${body.id} doesn't exist`, { status: 404 });
	}

	const data: { title?: string; description?: string; repoLink?: string; contentURL?: string } =
		{};
	if ("title" in body) {
		data.title = body.title;
	}
	if ("description" in body) {
		data.description = body.description;
	}
	if ("repoLink" in body) {
		data.repoLink = body.repoLink;
	}
	if ("contentURL" in body) {
		data.contentURL = body.contentURL;
	}

	const project = await prisma.project.update({
		where: {
			id: body.id,
		},
		data,
	});

	return Response.json(project, { status: 201 });
}

export async function DELETE(request: Request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 422 });
	}

	if (!("id" in body)) {
		return new Response("'id' must be included in the body", { status: 400 });
	}

	const projectExists =
		(await prisma.project.findUnique({
			where: {
				id: body.id,
			},
		})) != null;

	if (!projectExists) {
		return new Response(`project with id ${body.id} doesn't exist`, { status: 404 });
	}

	const project = await prisma.project.delete({
		where: { id: body.id },
	});

	return Response.json(project, { status: 201 });
}
