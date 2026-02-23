import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id: rawId } = await params;
		const id = parseInt(rawId);
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
