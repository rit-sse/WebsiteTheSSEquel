import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
	const mentorSkill = await prisma.mentorSkill.findMany({
		select: {
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
