import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
	try {
		const id = parseInt(params.id);
		const mentorSkill = await prisma.mentorSkill.findUnique({
			where: {
				id,
			},
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
		if (mentorSkill == null) {
			return new Response(`Couldn't find MentorSkill ID ${id}`);
		}
		return Response.json(mentorSkill);
	} catch {
		return new Response("Invalid MentorSkill ID", { status: 400 });
	}
}
