import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
	try {
		const id = parseInt(params.id);
		const skill = await prisma.skill.findUnique({
			where: {
				id,
			},
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
		if (skill == null) {
			return new Response(`Couldn't find Skill ID ${id}`, { status: 404 });
		}
		return Response.json(skill);
	} catch {
		return new Response("Invalid Skill ID", { status: 400 });
	}
}

