import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient();

export async function GET() {
	const skills = await prisma.skill.findMany({
		select: {
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

	console.log(body);

	if (!("skill" in body)) {
		return new Response("skill must be included in the body", { status: 400 });
	}
	const skillName = body.skill;

	console.log(`skill name: ${skillName}`);

	const skillCount = await prisma.skill.count();

	console.log(skillCount);

	const skill = await prisma.skill.create({
		data: {
			id: skillCount+1,
			skill: skillName,
		},
	});

	console.log(skill);

	return Response.json(skill, { status: 201 });
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
	const id = body.id;

	console.log(id);

	const skillExists = await prisma.skill.findUnique({
		where: {
			id: id,
		},
	});
	if (skillExists == null) {
		return new Response(`Coulnd't find skill ID ${id}`, { status: 404 });
	}

	const _deleteMentorSkills = await prisma.mentorSkill.deleteMany({
		where: { skill_Id: id },
	});

	const skill = await prisma.skill.delete({
		where: {
			id: id,
		},
	});
	return Response.json(skill);
}
