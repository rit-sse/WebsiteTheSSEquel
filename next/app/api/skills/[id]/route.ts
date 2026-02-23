import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id: idStr } = await params;
	try {
		const id = parseInt(idStr);
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

