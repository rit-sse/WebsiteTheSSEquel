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
