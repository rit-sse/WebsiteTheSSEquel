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
	const event1 = await prisma.event.create({
		data: {
			id: "1",
			title: "Keeping it Silly",
			date: new Date("2023-11-1 12:00:00"),
			description: "we keep it silly :3",
		},
	});

	const event2 = await prisma.event.create({
		data: {
			id: "2",
			title: "Catan Tournament",
			date: new Date("2023-11-1 12:00:00"),
			description: "Elyza will win again.",
			image: "/images/codfather.jpg",
			location: "none",
		},
	});

	const event3 = await prisma.event.create({
		data: {
			id: "3",
			title: "AAA",
			date: new Date("2023-11-1 12:00:00"),
			description: "ooops",
			image: "/images/codfather.jpg",
			location: "none",
		},
	});

	const event4 = await prisma.event.create({
		data: {
			id: "4",
			title: "Bing bing",
			date: new Date("2023-11-1 12:00:00"),
			description: "bing bing bing",
			image: "/images/codfather.jpg",
			location: "none",
		},
	});

	const event5 = await prisma.event.create({
		data: {
			id: "5",
			title: "Farihaaaa",
			date: new Date("2023-11-1 12:00:00"),
			description: "poop poop poop",
			image: "/images/codfather.jpg",
			location: "none",
		},
	});

	const event6 = await prisma.event.create({
		data: {
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

	console.log({ membership1, membership2, membership3, membership4, membership5 });

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

async function seedTextbooks() {

	await prisma.textbooks.deleteMany({}); // Clear existing textbooks

	const textbook1 = await prisma.textbooks.upsert({
		where: { id: 1 },
		update: {},
		create: {
			name: "Rapid Development: Taming Wild Software Schedules",
			description: "In Rapid Development, software industry guru Steve McConnell offers field-tested techniques to help you dramatically accelerate your development schedule--without sacrificing quality. Drawing on a rich trove of case studies and examples from his own consulting practice, McConnell identifies the most effective strategies for streamlining every phase of the development process.",
			authors: "Steve McConnell",
			image: "/library-assets/9781556159006.jpg",
			ISBN: "9781556159006",
			edition: "",
			publisher: "Pearson Education",
			yearPublished: "1996",
			keyWords: "software development, project management, software engineering",
			classInterest: "SWEN-256",
			checkedOut: false
		},
	});

	const textbook2 = await prisma.textbooks.upsert({
		where: { id: 2 },
		update: {},
		create: {
			name: "Design Patterns: Elements of Reusable Object-Oriented Software",
			description: "Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems. Previously undocumented, these 23 patterns allow designers to create more flexible, elegant, and ultimately reusable designs without having to rediscover the design solutions themselves.",
			authors: "Erich Gamma; Richard Helm; Ralph Johnson; John Vlissides",
			image: "/library-assets/9780201633610.jpg",
			ISBN: "9780201633610",
			edition: "1",
			publisher: "Addison-Wesley Professional",
			yearPublished: "1994",
			keyWords: "software design, software engineering, object-oriented programming",
			classInterest: "SWEN-262",
			checkedOut: false
		},
	});

	const textbook3 = await prisma.textbooks.upsert({
		where: { id: 3 },
		update: {},
		create: {
			name: "C Programming Language, 2nd Edition",
			description: "Learn how to program in C from the developers of C, Brian Kernighan and Dennis Ritchie. Intended for those with at least some experience with one other language (even if you are a novice), this book contains a tutorial introduction to get new users started as soon as possible and separate chapters on each major feature.",
			authors: "Brian W. Kernighan; Dennis M. Ritchie",
			image: "/library-assets/9780131103627.jpg",
			ISBN: "9780131103627",
			edition: "2",
			publisher: "Pearson",
			yearPublished: "1988",
			keyWords: "C programming, software development, programming languages",
			classInterest: "SWEN-250, SWEN-340",
			checkedOut: false
		},
	});

	const textbook4 = await prisma.textbooks.upsert({
		where: { id: 4 },
		update: {},
		create: {
			name: "Probability and Statistics for Engineering and the Sciences",
			description: "Put statistical theories into practice with PROBABILITY AND STATISTICS FOR ENGINEERING AND THE SCIENCES, 9th Edition. Always a favorite with statistics students, this calculus-based text offers a comprehensive introduction to probability and statistics while demonstrating how professionals apply concepts, models, and methodologies in today's engineering and scientific careers. Jay Devore, an award-winning professor and internationally recognized author and statistician, emphasizes authentic problem scenarios in a multitude of examples and exercises, many of which involve real data, to show how statistics makes sense of the world. Mathematical development and derivations are kept to a minimum. The book also includes output, graphics, and screen shots from various statistical software packages to give you a solid perspective of statistics in action. A Student Solutions Manual, which includes worked-out solutions to almost all the odd-numbered exercises in the book, is available.",
			authors: "Jay L. Devore",
			image: "/library-assets/9781305251809.jpg",
			ISBN: "9781305251809",
			edition: "9",
			publisher: "Cengage Learning",
			yearPublished: "2015",
			keyWords: "probability, statistics, engineering",
			classInterest: "MATH-251",
			checkedOut: false
		},
	});


	console.log({ textbook1, textbook2, textbook3, textbook4 });
}

async function main() {
	try {
		// Core data seeding
		await seedUser(); // Test users for development only

		await seedTextbooks();

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
		await seedHourBlock();
		await seedSchedule();
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
