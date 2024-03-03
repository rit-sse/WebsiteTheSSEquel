import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
	const skills = await prisma.skill.findMany({
		select: {
            id: true,
			skill: true,
			mentorSkill: {
				select: {
					id: true,
					mentor_Id: true,
					skill_Id: true,
				},
			},
		},
	});
	return Response.json(skills);
}

export async function POST(request: Request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 422 });
	}

	if (!("skill" in body)) {
		return new Response("'skill' must be included in the body", { status: 400 });
	}

	const skill_exists = await prisma.skill.findFirst({
		where: {
			skill: body.skill,
		},
	});
	if (skill_exists != null) {
		console.log(skill_exists);
		return new Response(`skill ${body.skill} already exists`, { status: 422 });
	}

	const skill = await prisma.skill.create({
		data: {
			skill: body.skill,
		},
	});

	return Response.json(skill, { status: 201 });
}

export async function PUT(request: Request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 422 });
	}

	if (!("id" in body)) {
		return new Response("'id'' must be in body", { status: 400 });
	}
	const skill_exists =
		(await prisma.skill.findUnique({
			where: { id: body.id },
		})) != null;
	if (!skill_exists) {
		return new Response(`Coulnd't find skill ID ${body.id}`, { status: 404 });
	}

	if (body.skill != undefined) {
		const skill_in_use = await prisma.skill.findUnique({
			where: {
				skill: body.skill,
			},
		});
		if (skill_in_use != undefined && skill_in_use?.id != body.id) {
			return new Response(`skill ${body.skill} already exists`, { status: 422 });
		}
	}

	const skill = await prisma.skill.update({
		where: {
			id: body.id,
		},
		data: {
			skill: body.skill,
		},
	});
	return Response.json(skill);
}

export async function DELETE(request: Request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 420 });
	}

	if (!("id" in body)) {
		return new Response("ID must be in body", { status: 400 });
	}

	const skillExists = await prisma.skill.findUnique({
		where: {
			id: body.id,
		},
	});
	if (skillExists == null) {
		return new Response(`Coulnd't find skill ID ${body.id}`, { status: 404 });
	}

	const _deleteMentorSkills = await prisma.mentorSkill.deleteMany({
		where: { skill_Id: body.id },
	});

	const skill = await prisma.skill.delete({
		where: {
			id: body.id,
		},
	});
	return Response.json(skill);
}
