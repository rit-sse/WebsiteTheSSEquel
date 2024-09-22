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

	const project = prisma.project.update({
		where: {
			id: body.id,
		},
		data: {
			title: body.title,
			description: body.description,
			repoLink: body.repoLink,
			contentURL: body.contentURL,
		}
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

	const project = await prisma.project.delete({
		where: { id: body.id },
	});

	return Response.json(project, { status: 201 });
}
