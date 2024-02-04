import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
	const mentorSkill = await prisma.mentorSkill.findMany({
		select: {
			id: true,
			mentor_Id: true,
			skill_Id: true,
			mentor: {
				select: {
					id: true,
					user_Id: true,
					expirationDate: true,
					isActive: true,
				},
			},
			skill: {
				select: {
					id: true,
					skill: true,
				},
			},
		},
	});
	return Response.json(mentorSkill);
}

export async function POST(request: Request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 422 });
	}

	if (!("mentor_Id" in body && "skill_Id" in body)) {
		return new Response('"mentor_Id" and "skill_Id" must be included in request body', {
			status: 400,
		});
	}

	const mentorSkill = await prisma.mentorSkill.create({
		data: {
			mentor_Id: body.mentor_Id,
			skill_Id: body.skill_Id,
		},
	});
	return Response.json(mentorSkill, { status: 201 });
}

export async function PUT(request: Request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 422 });
	}

	if (!("id" in body)) {
		return new Response("'id' must be in body", { status: 400 });
	}

	const mentorSkill_exists =
		(await prisma.mentorSkill.findUnique({
			where: { id: body.id },
		})) != null;
	if (!mentorSkill_exists) {
		return new Response(`Couldn't find mentorSkill with ID ${body.id}`, { status: 404 });
	}
	if ("mentor_Id" in body) {
		const mentor_exists =
			(await prisma.mentor.findUnique({
				where: { id: body.mentor_Id },
			})) != null;
		if (!mentor_exists) {
			return new Response(`Couldn't find mentor with ID ${body.mentor_Id}`, { status: 404 });
		}
	}
	if ("skill_Id" in body) {
		const skill_exists =
			(await prisma.skill.findUnique({
				where: { id: body.skill_Id },
			})) != null;
		if (!skill_exists) {
			return new Response(`Couldn't find skill with ID ${body.skill_Id}`, { status: 404 });
		}
	}

	const mentorSkill = await prisma.mentorSkill.update({
		where: {
			id: body.id,
		},
		data: {
			mentor_Id: body.mentor_Id,
			skill_Id: body.skill_Id,
		},
	});
	return Response.json(mentorSkill);
}
