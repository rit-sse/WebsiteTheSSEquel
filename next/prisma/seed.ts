import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * IMPORTANT: User Creation Strategy
 * 
 * In production, users are ONLY created through OAuth sign-in via NextAuth.
 * The invitation system sends emails to prospective users/officers who then
 * sign in with their RIT Google account, which creates their User, Account,
 * and Session records automatically.
 * 
 * The test users below are for development/testing purposes only and allow
 * seeding of related data (quotes, mentors, officers, etc.). In production,
 * these users would be created via the invitation flow instead.
 * 
 * DO NOT manually create Account or Session records - these are managed by NextAuth.
 */

async function seedUser() {
	const johndoe = await prisma.user.upsert({
		where: { email: "johndoe@rit.edu" },
		update: {},
		create: {
			name: "John Doe",
			email: "johndoe@rit.edu",
		},
	});
	const janedoe = await prisma.user.upsert({
		where: { email: "janedoe@rit.edu" },
		update: {},
		create: {
			name: "Jane Doe",
			email: "janedoe@rit.edu",
		},
	});
	const johnsmith = await prisma.user.upsert({
		where: { email: "johnsmith@rit.edu" },
		update: {},
		create: {
			name: "John Smith",
			email: "johnsmith@rit.edu",
		},
	});
	console.log({ johndoe, janedoe, johnsmith });
}

async function seedQuote() {
	const quote1 = await prisma.quote.upsert({
		where: { id: 1 },
		update: {},
		create: {
			date_added: new Date("2023-11-1 12:00:00"),
			quote: "This is a quote",
			user_id: 1,
		},
	});

	const quote2 = await prisma.quote.upsert({
		where: { id: 2 },
		update: {},
		create: {
			date_added: new Date("2023-11-1 12:00:00"),
			quote: "This is another quote",
			user_id: 2,
		},
	});

	const quote3 = await prisma.quote.upsert({
		where: { id: 3 },
		update: {},
		create: {
			date_added: new Date("2023-11-1 12:00:00"),
			quote: "This is a third quote",
			user_id: 3,
		},
	});

	console.log({ quote1, quote2, quote3 });
}

async function seedOfficerPosition() {
	// Canonical list of all officer positions
	const positions = [
		// Primary Officers (4)
		{ title: "President", is_primary: true, email: "sse-president@rit.edu" },
		{ title: "Vice President", is_primary: true, email: "sse-vicepresident@rit.edu" },
		{ title: "Treasurer", is_primary: true, email: "sse-treasurer@rit.edu" },
		{ title: "Secretary", is_primary: true, email: "sse-secretary@rit.edu" },
		// Committee Heads (11)
		{ title: "Mentoring Head", is_primary: false, email: "sse-mentoring@rit.edu" },
		{ title: "Public Relations Head", is_primary: false, email: "sse-pr@rit.edu" },
		{ title: "Student Outreach Head", is_primary: false, email: "sse-outreach@rit.edu" },
		{ title: "Technology Head", is_primary: false, email: "sse-tech@rit.edu" },
		{ title: "Events Head", is_primary: false, email: "sse-events@rit.edu" },
		{ title: "Winter Ball Head", is_primary: false, email: "sse-winterball@rit.edu" },
		{ title: "Lab Ops Head", is_primary: false, email: "sse-labops@rit.edu" },
		{ title: "Projects Head", is_primary: false, email: "sse-projects@rit.edu" },
		{ title: "Talks Head", is_primary: false, email: "sse-talks@rit.edu" },
		{ title: "Career Development Head", is_primary: false, email: "sse-careers@rit.edu" },
		{ title: "Marketing Head", is_primary: false, email: "sse-marketing@rit.edu" },
	];

	// First, clean up any old positions that don't match our canonical list
	const canonicalTitles = positions.map(p => p.title);
	await prisma.officerPosition.deleteMany({
		where: {
			title: { notIn: canonicalTitles },
			officers: { none: {} } // Only delete if no officers assigned
		}
	});

	// Upsert each position
	for (const pos of positions) {
		await prisma.officerPosition.upsert({
			where: { title: pos.title },
			update: { is_primary: pos.is_primary, email: pos.email },
			create: pos,
		});
	}

	console.log(`Seeded ${positions.length} officer positions`);
}

async function seedOfficer() {
	// Seed a test officer (President) for development
	const presidentPosition = await prisma.officerPosition.findFirst({
		where: { title: "President" }
	});
	
	if (presidentPosition) {
		const officer = await prisma.officer.upsert({
			where: { id: 1 },
			update: {},
			create: {
				position_id: presidentPosition.id,
				user_id: 1,
				is_active: true,
				start_date: new Date("2025-08-01"),
				end_date: new Date("2026-05-31"),
			},
		});
		console.log("Seeded test officer:", officer);
	}
}

async function seedMentor() {
	const mentor1 = await prisma.mentor.upsert({
		where: { id: 1 },
		update: {},
		create: {
			id: 1,
			user_Id: 1,
			expirationDate: new Date("2023-11-1 12:00:00"),
			isActive: true,
		},
	});
	const mentor2 = await prisma.mentor.upsert({
		where: { id: 2 },
		update: {},
		create: {
			id: 2,
			user_Id: 2,
			expirationDate: new Date("2023-11-1 12:00:00"),
			isActive: true,
		},
	});

	const mentor3 = await prisma.mentor.upsert({
		where: { id: 3 },
		update: {},
		create: {
			id: 3,
			user_Id: 3,
			expirationDate: new Date("2023-11-1 12:00:00"),
			isActive: true,
		},
	});
	console.log({ mentor1, mentor2, mentor3 });
}

async function seedMentorRosterAndApplications() {
	const activeSchedule =
		(await prisma.mentorSchedule.findFirst({ where: { isActive: true } })) ??
		(await prisma.mentorSchedule.create({
			data: { name: "Mentor Schedule", isActive: true },
		}));

	const semesterStart = new Date("2026-01-12T00:00:00.000Z");
	const semesterEnd = new Date("2026-05-08T00:00:00.000Z");
	const applicationOpen = new Date("2025-11-15T00:00:00.000Z");
	const applicationClose = new Date("2026-01-10T00:00:00.000Z");

	const activeSemester =
		(await prisma.mentorSemester.findFirst({ where: { isActive: true } })) ??
		(await prisma.mentorSemester.create({
			data: {
				name: "Spring 2026",
				isActive: true,
				scheduleId: activeSchedule.id,
				semesterStart,
				semesterEnd,
				applicationOpen,
				applicationClose,
			},
		}));

	const seedNames = [
		["Avery", "Nguyen"],
		["Jordan", "Patel"],
		["Morgan", "Kim"],
		["Riley", "Martinez"],
		["Taylor", "Johnson"],
		["Casey", "Lee"],
		["Alex", "Brown"],
		["Jamie", "Smith"],
		["Parker", "Davis"],
		["Quinn", "Garcia"],
		["Reese", "Walker"],
		["Skyler", "Thompson"],
		["Emerson", "Wright"],
		["Rowan", "Clark"],
		["Sawyer", "Lopez"],
		["Finley", "Hill"],
		["Dakota", "Scott"],
		["Harper", "Young"],
		["Logan", "Allen"],
		["Cameron", "Harris"],
	];

	const users = [];
	for (const [firstName, lastName] of seedNames) {
		const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@g.rit.edu`;
		const user = await prisma.user.upsert({
			where: { email },
			update: { name: `${firstName} ${lastName}` },
			create: {
				name: `${firstName} ${lastName}`,
				email,
			},
		});
		users.push(user);
	}

	const mentors = [];
	const maxMentorId = await prisma.mentor.aggregate({ _max: { id: true } });
	let nextMentorId = (maxMentorId._max.id ?? 0) + 1;
	for (const user of users) {
		const existing = await prisma.mentor.findFirst({
			where: { user_Id: user.id },
		});
		if (existing) {
			mentors.push(existing);
			continue;
		}
		const mentor = await prisma.mentor.create({
			data: {
				id: nextMentorId++,
				user_Id: user.id,
				expirationDate: semesterEnd,
				isActive: true,
			},
		});
		mentors.push(mentor);
	}

	await prisma.$executeRaw`
		SELECT setval(
			pg_get_serial_sequence('"Mentor"', 'id'),
			(SELECT COALESCE(MAX(id), 1) FROM "Mentor")
		)
	`;

	// Assign random skills and courses to each mentor
	const allSkills = await prisma.skill.findMany();
	const allCourses = await prisma.course.findMany();

	for (const mentor of mentors) {
		// Give each mentor 1-3 random skills
		const skillCount = 1 + Math.floor(Math.random() * Math.min(3, allSkills.length));
		const shuffledSkills = [...allSkills].sort(() => Math.random() - 0.5).slice(0, skillCount);
		for (const skill of shuffledSkills) {
			const existing = await prisma.mentorSkill.findFirst({
				where: { mentor_Id: mentor.id, skill_Id: skill.id },
			});
			if (!existing) {
				await prisma.mentorSkill.create({
					data: { mentor_Id: mentor.id, skill_Id: skill.id },
				});
			}
		}

		// Give each mentor 1-2 random courses
		const courseCount = 1 + Math.floor(Math.random() * Math.min(2, allCourses.length));
		const shuffledCourses = [...allCourses].sort(() => Math.random() - 0.5).slice(0, courseCount);
		for (const course of shuffledCourses) {
			const existing = await prisma.courseTaken.findFirst({
				where: { mentorId: mentor.id, courseId: course.id },
			});
			if (!existing) {
				await prisma.courseTaken.create({
					data: { mentorId: mentor.id, courseId: course.id },
				});
			}
		}
	}

	console.log(`Assigned skills and courses to ${mentors.length} mentors`);

	const randomSlots = (count: number) => {
		const slotKeys = new Set<string>();
		while (slotKeys.size < count) {
			const weekday = 1 + Math.floor(Math.random() * 5);
			const hour = 10 + Math.floor(Math.random() * 8);
			slotKeys.add(`${weekday}-${hour}`);
		}
		return Array.from(slotKeys).map((key) => {
			const [weekday, hour] = key.split("-").map(Number);
			return { weekday, hour };
		});
	};

	for (const user of users) {
		const slotCount = 4 + Math.floor(Math.random() * 6);
		const slots = randomSlots(slotCount);
		await prisma.mentorAvailability.upsert({
			where: {
				userId_semesterId: {
					userId: user.id,
					semesterId: activeSemester.id,
				},
			},
			update: { slots: JSON.stringify(slots) },
			create: {
				userId: user.id,
				semesterId: activeSemester.id,
				slots: JSON.stringify(slots),
			},
		});
	}

	const applicationUsers = users.slice(0, 3);
	for (let index = 0; index < applicationUsers.length; index++) {
		const user = applicationUsers[index];
		const courseOptions = [
			["SWEN 123", "SWEN 124"],
			["SWEN 250", "SWEN 261"],
			["GCIS 123", "GCIS 124"],
		];
		await prisma.mentorApplication.upsert({
			where: {
				userId_semesterId: {
					userId: user.id,
					semesterId: activeSemester.id,
				},
			},
			update: {
				discordUsername: `${user.name.split(" ")[0].toLowerCase()}#${3100 + index}`,
				pronouns: "they/them",
				major: "SE",
				yearLevel: "3rd",
				coursesJson: JSON.stringify(courseOptions[index % courseOptions.length]),
				skillsText: "Java, Python, React",
				toolsComfortable: "Git, VS Code, Postman",
				toolsLearning: "Docker, Prisma",
				previousSemesters: index,
				whyMentor: "I want to help students feel confident in their coursework.",
				comments: "Excited to mentor and learn from others!",
				status: "pending",
			},
			create: {
				userId: user.id,
				semesterId: activeSemester.id,
				discordUsername: `${user.name.split(" ")[0].toLowerCase()}#${3100 + index}`,
				pronouns: "they/them",
				major: "SE",
				yearLevel: "3rd",
				coursesJson: JSON.stringify(courseOptions[index % courseOptions.length]),
				skillsText: "Java, Python, React",
				toolsComfortable: "Git, VS Code, Postman",
				toolsLearning: "Docker, Prisma",
				previousSemesters: index,
				whyMentor: "I want to help students feel confident in their coursework.",
				comments: "Excited to mentor and learn from others!",
				status: "pending",
			},
		});
	}

	console.log(
		`Seeded ${users.length} mentor users, ${mentors.length} mentors, ${applicationUsers.length} applications`
	);
}

async function seedMentorHeadcountData() {
	const activeSemester = await prisma.mentorSemester.findFirst({
		where: { isActive: true },
		select: { id: true },
	});

	if (!activeSemester) {
		console.log("No active mentor semester found, skipping headcount seed.");
		return;
	}

	const mentors = await prisma.mentor.findMany({
		where: { isActive: true },
		select: { id: true },
	});

	if (mentors.length === 0) {
		console.log("No mentors found, skipping headcount seed.");
		return;
	}

	const courses = await prisma.course.findMany({
		select: { id: true },
	});

	const randomInt = (min: number, max: number) =>
		Math.floor(Math.random() * (max - min + 1)) + min;

	const pickRandom = <T,>(items: T[], count: number) => {
		const shuffled = [...items].sort(() => 0.5 - Math.random());
		return shuffled.slice(0, count);
	};

	const feelings = [
		"Pretty steady shift.",
		"Busy but manageable.",
		"Lots of great questions today.",
		"Quiet hour, caught up on cleanup.",
		"High traffic but good energy.",
	];

	const now = new Date();
	for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
		const dateBase = new Date(now);
		dateBase.setDate(now.getDate() - dayOffset);

		const hours = [10, 11, 12, 13, 14, 15, 16, 17];
		for (const hour of hours) {
			const mentorEntry = await prisma.mentorHeadcountEntry.create({
				data: {
					semesterId: activeSemester.id,
					peopleInLab: randomInt(5, 20),
					feeling: feelings[randomInt(0, feelings.length - 1)],
					createdAt: new Date(
						dateBase.getFullYear(),
						dateBase.getMonth(),
						dateBase.getDate(),
						hour,
						30
					),
				},
			});

			const mentorSample = pickRandom(mentors, randomInt(1, Math.min(3, mentors.length)));
			for (const mentor of mentorSample) {
				await prisma.mentorHeadcountMentor.create({
					data: {
						entryId: mentorEntry.id,
						mentorId: mentor.id,
					},
				});
			}

			const menteeEntry = await prisma.menteeHeadcountEntry.create({
				data: {
					semesterId: activeSemester.id,
					studentsMentoredCount: randomInt(3, 20),
					testsCheckedOutCount: randomInt(0, 5),
					otherClassText: null,
					createdAt: new Date(
						dateBase.getFullYear(),
						dateBase.getMonth(),
						dateBase.getDate(),
						hour,
						55
					),
				},
			});

			const menteeMentors = pickRandom(mentors, randomInt(1, Math.min(3, mentors.length)));
			for (const mentor of menteeMentors) {
				await prisma.menteeHeadcountMentor.create({
					data: {
						entryId: menteeEntry.id,
						mentorId: mentor.id,
					},
				});
			}

			if (courses.length > 0) {
				const courseSample = pickRandom(courses, randomInt(1, Math.min(2, courses.length)));
				for (const course of courseSample) {
					await prisma.menteeHeadcountCourse.create({
						data: {
							entryId: menteeEntry.id,
							courseId: course.id,
						},
					});
				}
			}
		}
	}

	console.log("Seeded two weeks of mentor/mentee headcount data");
}

async function seedSkill() {
	const java = await prisma.skill.upsert({
		where: { id: 1 },
		update: {},
		create: {
			skill: "Java",
		},
	});

	const cpp = await prisma.skill.upsert({
		where: { id: 2 },
		update: {},
		create: {
			skill: "c++",
		},
	});

	const python = await prisma.skill.upsert({
		where: { id: 3 },
		update: {},
		create: {
			skill: "Python",
		},
	});
	console.log({ java, cpp, python });
}

async function seedAlumni() {
	const alumni1 = await prisma.alumni.upsert({
		where: { id: 1 },
		update: {},
		create: {
			id: 1,
			name: "Bob",
			email: "bob@rit.edu",
			linkedIn: "linkedin.com/bob",
			gitHub: "github.com/bob",
			description: "bob is bob",
			start_date: ("Fall 2017"),
			end_date: ("Spring 2023"),
			previous_roles: "President",
			quote: "01001000 01100101 01101100 01101100 01101111"
		},
	});

	const alumni2 = await prisma.alumni.upsert({
		where: { id: 2 },
		update: {},
		create: {
			id: 2,
			name: "Fred",
			email: "fred@rit.edu",
			linkedIn: "linkedin.com/fred",
			gitHub: "github.com/fred",
			description: "fred is fred",
			start_date: ("Spring 2020"),
			end_date: ("Fall 2025"),
			previous_roles: "Tech Head, Vice President",
			quote: "Pinapple on pizza <3"
		},
	});
	console.log({ alumni1, alumni2 });

}

async function seedMentorSkill() {
	const mentorSkill1 = await prisma.mentorSkill.upsert({
		where: { id: 1 },
		update: {},
		create: {
			mentor_Id: 1,
			skill_Id: 1,
		},
	});

	const mentorSkill2 = await prisma.mentorSkill.upsert({
		where: { id: 2 },
		update: {},
		create: {
			mentor_Id: 2,
			skill_Id: 2,
		},
	});

	const mentorSkill3 = await prisma.mentorSkill.upsert({
		where: { id: 3 },
		update: {},
		create: {
			mentor_Id: 3,
			skill_Id: 3,
		},
	});

	console.log({ mentorSkill1, mentorSkill2, mentorSkill3 });
}

//Joe
async function seedDepartment() {
	const department1 = await prisma.department.upsert({
		where: { id: 1 },
		update: { shortTitle: "CS" },
		create: {
			id: 1,
			title: "Computer Science",
			shortTitle: "CS",
		},
	});
	const department2 = await prisma.department.upsert({
		where: { id: 2 },
		update: { shortTitle: "SWEN" },
		create: {
			id: 2,
			title: "Software Engineering",
			shortTitle: "SWEN",
		},
	});
	const department3 = await prisma.department.upsert({
		where: { id: 3 },
		update: { shortTitle: "IGM" },
		create: {
			id: 3,
			title: "Interactive Games and Media",
			shortTitle: "IGM",
		},
	});
	console.log({ department1, department2, department3 });
}

//Joe
async function seedCourse() {
	const course1 = await prisma.course.upsert({
		where: { id: 1 },
		update: {},
		create: {
			id: 1,
			title: "Software Development I",
			departmentId: 2,
			code: 123,
		},
	});
	const course2 = await prisma.course.upsert({
		where: { id: 2 },
		update: {},
		create: {
			id: 2,
			title: "Software Development II",
			departmentId: 2,
			code: 124,
		},
	});
	const course3 = await prisma.course.upsert({
		where: { id: 3 },
		update: {},
		create: {
			id: 3,
			title: "CS For AP Students",
			departmentId: 1,
			code: 140,
		},
	});
	console.log({ course1, course2, course3 });
}

async function seedCourseTaken() {
	const courseTaken1 = await prisma.courseTaken.upsert({
		where: { id: 1 },
		update: {},
		create: {
			mentorId: 1,
			courseId: 1,
		},
	});
	const courseTaken2 = await prisma.courseTaken.upsert({
		where: { id: 2 },
		update: {},
		create: {
			mentorId: 2,
			courseId: 2,
		},
	});
	const courseTaken3 = await prisma.courseTaken.upsert({
		where: { id: 3 },
		update: {},
		create: {
			mentorId: 3,
			courseId: 3,
		},
	});
	console.log({ courseTaken1, courseTaken2, courseTaken3 });
}

async function seedHourBlock() {
	const hourBlock1 = await prisma.hourBlock.upsert({
		where: { id: 1 },
		update: {},
		create: {
			weekday: "Monday",
			startTime: new Date("2023-11-1 12:00:00"),
		},
	});
	const hourBlock2 = await prisma.hourBlock.upsert({
		where: { id: 2 },
		update: {},
		create: {
			weekday: "Tuesday",
			startTime: new Date("2023-11-2 12:00:00"),
		},
	});
	const hourBlock3 = await prisma.hourBlock.upsert({
		where: { id: 3 },
		update: {},
		create: {
			weekday: "Wednesday",
			startTime: new Date("2023-11-3 12:00:00"),
		},
	});
	console.log({ hourBlock1, hourBlock2, hourBlock3 });
}

async function seedSchedule() {
	const schedule1 = await prisma.schedule.upsert({
		where: { id: 1 },
		update: {},
		create: {
			id: 1,
			mentorId: 1,
			hourBlockId: 1,
		},
	});
	const schedule2 = await prisma.schedule.upsert({
		where: { id: 2 },
		update: {},
		create: {
			id: 2,
			mentorId: 2,
			hourBlockId: 2,
		},
	});
	const schedule3 = await prisma.schedule.upsert({
		where: { id: 3 },
		update: {},
		create: {
			id: 3,
			mentorId: 3,
			hourBlockId: 3,
		},
	});
	console.log({ schedule1, schedule2, schedule3 });
}

// New mentor schedule system
async function seedMentorSchedule() {
	const mentorSchedule1 = await prisma.mentorSchedule.upsert({
		where: { id: 1 },
		update: {},
		create: {
			id: 1,
			name: "Spring 2026",
			isActive: true,
		},
	});
	const mentorSchedule2 = await prisma.mentorSchedule.upsert({
		where: { id: 2 },
		update: {},
		create: {
			id: 2,
			name: "Fall 2025",
			isActive: false,
		},
	});
	console.log({ mentorSchedule1, mentorSchedule2 });
}

async function seedScheduleBlock() {
	// Sample schedule blocks for Spring 2026
	const blocks = [
		// Mentor 1 - Monday and Wednesday at 10am
		{ weekday: 1, startHour: 10, mentorId: 1, scheduleId: 1 },
		{ weekday: 3, startHour: 10, mentorId: 1, scheduleId: 1 },
		// Mentor 2 - Tuesday and Thursday at 12pm
		{ weekday: 2, startHour: 12, mentorId: 2, scheduleId: 1 },
		{ weekday: 4, startHour: 12, mentorId: 2, scheduleId: 1 },
		// Mentor 3 - Monday and Friday at 2pm
		{ weekday: 1, startHour: 14, mentorId: 3, scheduleId: 1 },
		{ weekday: 5, startHour: 14, mentorId: 3, scheduleId: 1 },
		// Double coverage on Wednesday at 2pm
		{ weekday: 3, startHour: 14, mentorId: 1, scheduleId: 1 },
		{ weekday: 3, startHour: 14, mentorId: 2, scheduleId: 1 },
	];

	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		await prisma.scheduleBlock.upsert({
			where: { id: i + 1 },
			update: {},
			create: {
				id: i + 1,
				...block,
			},
		});
	}
	console.log(`Seeded ${blocks.length} schedule blocks`);
}

async function seedGoLinks() {
	const goLink1 = await prisma.goLinks.upsert({
		where: { id: 1 },
		update: {},
		create: {
			golink: "sse",
			url: "sse.rit.edu",
			description: "SSE Website",
			createdAt: new Date("2023-11-1 12:00:00"),
			updatedAt: new Date("2023-11-1 12:00:00"),
			isPublic: true,
			isPinned: true,
		},
	});
	const goLink2 = await prisma.goLinks.upsert({
		where: { id: 2 },
		update: {},
		create: {
			id: 2,
			golink: "google",
			url: "google.com",
			description: "An underground and unknown search engine",
			createdAt: new Date("2023-11-1 12:00:00"),
			updatedAt: new Date("2023-11-1 12:00:00"),
			isPublic: true,
			isPinned: true,
		},
	});
	const goLink3 = await prisma.goLinks.upsert({
		where: { id: 3 },
		update: {},
		create: {
			id: 3,
			golink: "youtube",
			url: "youtube.com",
			description: "A small video sharing website",
			createdAt: new Date("2023-11-1 12:00:00"),
			updatedAt: new Date("2023-11-1 12:00:00"),
			isPublic: true,
			isPinned: true,
		},
	});
	console.log({ goLink1, goLink2, goLink3 });
}

/**
 * DEPRECATED: Do not seed Account records
 * 
 * Account records are created automatically by NextAuth when users sign in
 * with OAuth (Google). Manually creating these records causes authentication
 * errors when users try to sign in.
 * 
 * Use the invitation system instead:
 * 1. Officer invites user via dashboard
 * 2. User receives email with sign-in link
 * 3. User signs in with Google OAuth
 * 4. NextAuth creates User + Account + Session automatically
 * 5. User accepts invitation to become officer/member
 */
// async function seedAccount() { ... }

/**
 * DEPRECATED: Do not seed Session records
 * 
 * Session records are created automatically by NextAuth when users sign in.
 * These are managed entirely by NextAuth and should never be manually created.
 */
// async function seedSession() { ... }

/**
 * DEPRECATED: Do not seed VerificationToken records
 * 
 * These are managed by NextAuth for email verification flows.
 */
// async function seedVerificationToken() { ... }

async function seedProject() {
	const project1 = await prisma.project.upsert({
		where: { id: 1 },
		update: {},
		create: {
			title: "Website Rebuild",
			description: "The new SSE website.",
			progress: "In Progress",
			leadid: 1,
			repoLink: "https://github.com/rit-sse/WebsiteTheSSEquel",
			contentURL: "/api/project/content/WEBSITE_REBUILD.md",
			projectImage: "",
			completed: false
		},
	});
	const project2 = await prisma.project.upsert({
		where: { id: 2 },
		update: {},
		create: {
			title: "Wave Machine",
			description: "A machine to automatically wave to tour groups.",
			progress: "Limbo",
			leadid: 2,
			repoLink: "https://github.com/rit-sse/robo-waver",
			contentURL: "/api/project/content/WAVE_MACHINE.md",
			projectImage: "",
			completed: false
		},
	});
	const project3 = await prisma.project.upsert({
		where: { id: 3 },
		update: {},
		create: {
			title: "Tour Sensor",
			description: "A proximity sensor to detect tours.",
			progress: "Unknown",
			leadid: 3,
			repoLink: "https://github.com/rit-sse/tour-sensor",
			contentURL: "/api/project/content/TOUR_SENSOR.md",
			projectImage: "",
			completed: false
		},
	});
	console.log({ project1, project2, project3 });
}

async function seedProjectContributor() {
	const projectContributor1 = await prisma.projectContributor.upsert({
		where: { id: 1 },
		update: {},
		create: {
			userId: 1,
			projectId: 1,
		},
	});
	const projectContributor2 = await prisma.projectContributor.upsert({
		where: { id: 2 },
		update: {},
		create: {
			userId: 2,
			projectId: 2,
		},
	});
	const projectContributor3 = await prisma.projectContributor.upsert({
		where: { id: 3 },
		update: {},
		create: {
			userId: 3,
			projectId: 3,
		},
	});
	console.log({ projectContributor1, projectContributor2, projectContributor3 });
}

async function seedEvents() {
  const event1 = await prisma.event.upsert({
    where: { id: "1" },
    update: {},
    create: {
	  id: "1" ,
      title: "Keeping it Silly",
      date: new Date("2023-11-1 12:00:00"),
      description: "we keep it silly :3",
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: "2" },
    update: {},
    create: {
	  id: "2",
      title: "Catan Tournament",
      date: new Date("2023-11-1 12:00:00"),
      description: "Elyza will win again.",
	  image: "/images/codfather.jpg",
	  location: "none",
    },
  });

  const event3 = await prisma.event.upsert({
    where: { id: "3" },
    update: {},
    create: {
	  id: "3",
      title: "AAA",
      date: new Date("2023-11-1 12:00:00"),
      description: "ooops",
	  image: "/images/codfather.jpg",
	  location: "none",
    },
  });

  const event4 = await prisma.event.upsert({
    where: { id: "4" },
    update: {},
    create: {
	  id: "4",
      title: "Bing bing",
      date: new Date("2023-11-1 12:00:00"),
      description: "bing bing bing",
	  image: "/images/codfather.jpg",
	  location: "none",
    },
  });

	const event5 = await prisma.event.upsert({
		where: { id: "5" },
		update: {},
		create: {
		  id: "5",
		  title: "Farihaaaa",
		  date: new Date("2023-11-1 12:00:00"),
		  description: "poop poop poop",
		  image: "/images/codfather.jpg",
		  location: "none",
		},
  });

  const event6 = await prisma.event.upsert({
	where: { id: "6" },
	update: {},
	create: {
	  id: "6",
	  title: "Spring Fling",
	  date: new Date("2023-11-1 12:00:00"),
	  description: "Spring thing",
	  image: "/images/spring-fling-2.png",
	  location: "none",
	},
  });

  console.log({ event1, event2, event3, event4, event5, event6 });
}

async function seedMemberships() {
	const membership1 = await prisma.memberships.create({
		data: {
			userId: 1,
			reason: "Test1",
			dateGiven: new Date("2025-10-1 12:00:00")
		}
	});

	const membership2 = await prisma.memberships.create({
		data: {
			userId: 2,
			reason: "Test2",
			dateGiven: new Date("2025-10-2 12:00:00")
		}
	});

	const membership3 = await prisma.memberships.create({
		data: {
			userId: 1,
			reason: "Test3",
			dateGiven: new Date("2025-10-2 12:00:00")
		}
	});

	const membership4 = await prisma.memberships.create({
		data: {
			userId: 1,
			reason: "Test4",
			dateGiven: new Date("2025-10-3 12:00:00")
		}
	});

	const membership5 = await prisma.memberships.create({
		data: {
			userId: 3,
			reason: "Test5",
			dateGiven: new Date("2025-10-4 12:00:00")
		}
	});

	console.log({membership1, membership2, membership3, membership4, membership5});

}

async function seedSponsors() {
	const sponsor1 = await prisma.sponsor.upsert({
		where: { id: 1 },
		update: {},
		create: {
			id: 1,
			name: "Golisano College",
			description: "RIT's College of Computing and Information Sciences, home to SSE.",
			logoUrl: "/images/sponsors/gcis.png",
			websiteUrl: "https://www.rit.edu/computing/",
			isActive: true,
		},
	});

	const sponsor2 = await prisma.sponsor.upsert({
		where: { id: 2 },
		update: {},
		create: {
			id: 2,
			name: "M&T Bank",
			description: "A regional bank providing financial services across the Northeast.",
			logoUrl: "/images/sponsors/M_and_T.png",
			websiteUrl: "https://www.mtb.com/",
			isActive: true,
		},
	});

	const sponsor3 = await prisma.sponsor.upsert({
		where: { id: 3 },
		update: {},
		create: {
			id: 3,
			name: "Mindex",
			description: "A Rochester-based technology company specializing in IT solutions.",
			logoUrl: "/images/sponsors/mindex.png",
			websiteUrl: "https://www.mindex.com/",
			isActive: true,
		},
	});

	console.log({ sponsor1, sponsor2, sponsor3 });
}

async function main() {
  try {
    // Core data seeding
    await seedUser(); // Test users for development only
    await seedQuote();
    await seedOfficerPosition(); // Officer positions (can exist without officers)
    await seedOfficer(); // Test officer assignment for development
    await seedMentor();
	await seedAlumni();
    await seedSkill();
    await seedMentorSkill();
    await seedDepartment();
    await seedCourse();
    await seedCourseTaken();
    await seedMentorHeadcountData();
    await seedHourBlock();
    await seedSchedule();
    // New mentor schedule system
    await seedMentorSchedule();
    await seedScheduleBlock();
    await seedMentorRosterAndApplications();
    await seedGoLinks();
    
    // REMOVED: seedAccount, seedSession, seedVerificationToken
    // These are now managed exclusively by NextAuth OAuth flow
    // Users sign in via invitation emails → OAuth creates these automatically
    
	await seedProject();
	await seedProjectContributor();
    await seedEvents();
	await seedMemberships();
	await seedSponsors();
  } catch (e) {
    console.error(e);
  }
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
