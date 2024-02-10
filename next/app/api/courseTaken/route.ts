import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
	const coursesTaken = await prisma.courseTaken.findMany({
		select: {
			id: true,
			mentorId: true,
			courseId: true,
			mentor: {
				select: {
					id: true,
					user_Id: true,
					expirationDate: true,
					isActive: true,
				},
			},
			course: {
				select: {
					id: true,
					title: true,
					departmentId: true,
					code: true,
				},
			},
		},
	});

	return Response.json(coursesTaken);
}
