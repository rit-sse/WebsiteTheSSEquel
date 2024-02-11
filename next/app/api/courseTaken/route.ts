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
<<<<<<< HEAD
 * @returns takenCourse object that was created
=======
 * @returns courseTaken object that was created
>>>>>>> dev/mentor-skill-api-routes
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
<<<<<<< HEAD
		const takenCourse = await prisma.courseTaken.create({
=======
		const courseTaken = await prisma.courseTaken.create({
>>>>>>> dev/mentor-skill-api-routes
			data: {
				mentorId: body.mentorId,
				courseId: body.courseId,
			},
		});
<<<<<<< HEAD
		return Response.json(takenCourse, { status: 201 });
	} catch (e) {
		return new Response(`Failed to create takenCourse: ${e}`, { status: 500 });
=======
		return Response.json(courseTaken, { status: 201 });
	} catch (e) {
		return new Response(`Failed to create courseTaken: ${e}`, { status: 500 });
>>>>>>> dev/mentor-skill-api-routes
	}
}

/**
 * HTTP PUT request to /api/courseTaken
 * @param {Object} request body of the HTTP PUT request
 * @param {number} request.id id of the object being updated
 * @param {number|undefined} request.mentorId identifier for mentor
 * @param {number|undefined} request.courseId identifier for course
<<<<<<< HEAD
 * @returns takenCourse object that was updated
=======
 * @returns courseTaken object that was updated
>>>>>>> dev/mentor-skill-api-routes
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
<<<<<<< HEAD
		const takenCourse = await prisma.courseTaken.update({
=======
		const courseTaken = await prisma.courseTaken.update({
>>>>>>> dev/mentor-skill-api-routes
			where: {
				id: body.id,
			},
			data: {
				mentorId: body.mentorId,
				courseId: body.courseId,
			},
		});
<<<<<<< HEAD
		return Response.json(takenCourse);
=======
		return Response.json(courseTaken);
>>>>>>> dev/mentor-skill-api-routes
	} catch (e) {
		return new Response(`Failed to update courseTaken: ${e}`, { status: 500 });
	}
}
<<<<<<< HEAD
=======

/**
 * HTTP DELETE request to /api/courseTaken
 * @param {Object} request body of the HTTP DELETE request
 * @param {number} reuqest.id id of the object being deleted
 * @returns courseTaken previously at { id }
 */
export async function DELETE(request: Request) {
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
		const courseTaken = await prisma.courseTaken.delete({
			where: {
				id: body.id,
			},
		});
		return Response.json(courseTaken);
	} catch (e) {
		return new Response(`Couldn't find courseTaken ID ${body.id}`, { status: 404 });
	}
}
>>>>>>> dev/mentor-skill-api-routes
