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
 * @param {Object} request body of the HTTP POST request
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

/**
 * HTTP PUT request to /api/courseTaken
 * @param {Object} request body of the HTTP PUT request
 * @param {number} request.id id of the object being updated
 * @param {number|undefined} request.mentorId identifier for mentor
 * @param {number|undefined} request.courseId identifier for course
 * @returns takenCourse object that was updated
 */
export async function PUT(request: Request) {
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON", { status: 422 });
	}

	if (!("id" in body)) {
		return new Response("id must be in body", { status: 422 });
	}

	try {
		const takenCourse = await prisma.courseTaken.update({
			where: {
				id: body.id,
			},
			data: {
				mentorId: body.mentorId,
				courseId: body.courseId,
			},
		});
		return Response.json(takenCourse);
	} catch (e) {
		return new Response(`Failed to update courseTaken: ${e}`, { status: 500 });
	}
}
