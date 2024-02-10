import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * HTTP GET request to /api/courseTaken
 * @returns list of courseTaken objects
 */
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

/**
 * HTTP POST request to /api/courseTaken
 * @param {number} request.mentorId identifier for mentor
 * @param {number} request.courseId identifier for course
 * @returns takenCourse object that was created
 */
export async function POST(request: Request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 422 });
	}

	if (!("mentorId" in body && "courseId" in body)) {
		return new Response("mentorId and courseId must be in body", { status: 422 });
	}

	console.log(body.mentorId);
	console.log(body.courseId);

	try {
		const takenCourse = await prisma.courseTaken.create({
			data: {
				mentorId: body.mentorId,
				courseId: body.courseId,
			},
		});
		return Response.json(takenCourse, { status: 201 });
	} catch (e) {
		return new Response(`Failed to create takenCourse: ${e}`, { status: 500 });
	}
}
