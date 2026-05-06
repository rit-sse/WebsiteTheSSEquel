import { PositionCategory, Prisma, PrismaClient } from "@prisma/client";
import {
  formatAcademicTerm,
  getAcademicTermDateRange,
  parseAcademicTermLabel,
} from "../lib/academicTerm";
import { PageContentSchema } from "../lib/pageBuilder/blocks";
import { EXISTING_CMS_PAGE_SEEDS } from "../lib/pageBuilder/existingPageSeeds";
import { contentHash } from "../lib/pageBuilder/hash";
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
    {
      title: "President",
      is_primary: true,
      email: "sse-president@rit.edu",
      category: PositionCategory.PRIMARY_OFFICER,
    },
    {
      // VP is chosen as a running mate (Amendment 12) but is still a
      // primary officer once they take office — they need primary-only
      // dashboard access (e.g. the Elections panel) like the rest of
      // the executive team. The election system filters VP out of the
      // direct-nomination grid via `isTicketDerivedOffice`, so flipping
      // is_primary back on doesn't make them separately nominatable.
      title: "Vice President",
      is_primary: true,
      email: "sse-vicepresident@rit.edu",
      category: PositionCategory.PRIMARY_OFFICER,
    },
    {
      title: "Treasurer",
      is_primary: true,
      email: "sse-treasurer@rit.edu",
      category: PositionCategory.PRIMARY_OFFICER,
    },
    {
      title: "Secretary",
      is_primary: true,
      email: "sse-secretary@rit.edu",
      category: PositionCategory.PRIMARY_OFFICER,
    },
    // Committee Heads (11)
    {
      // Post-Amendment 13: Mentoring Head is now a Primary Officer.
      title: "Mentoring Head",
      is_primary: true,
      email: "sse-mentoring@rit.edu",
      category: PositionCategory.PRIMARY_OFFICER,
    },
    {
      title: "Public Relations Head",
      is_primary: false,
      email: "sse-pr@rit.edu",
      category: PositionCategory.COMMITTEE_HEAD,
    },
    {
      title: "Student Outreach Head",
      is_primary: false,
      email: "sse-outreach@rit.edu",
      category: PositionCategory.COMMITTEE_HEAD,
    },
    {
      title: "Technology Head",
      is_primary: false,
      email: "sse-tech@rit.edu",
      category: PositionCategory.COMMITTEE_HEAD,
    },
    {
      title: "Events Head",
      is_primary: false,
      email: "sse-events@rit.edu",
      category: PositionCategory.COMMITTEE_HEAD,
    },
    {
      title: "Winter Ball Head",
      is_primary: false,
      email: "sse-winterball@rit.edu",
      category: PositionCategory.COMMITTEE_HEAD,
    },
    {
      title: "Lab Ops Head",
      is_primary: false,
      email: "sse-labops@rit.edu",
      category: PositionCategory.COMMITTEE_HEAD,
    },
    {
      title: "Projects Head",
      is_primary: false,
      email: "sse-projects@rit.edu",
      category: PositionCategory.COMMITTEE_HEAD,
    },
    {
      title: "Talks Head",
      is_primary: false,
      email: "sse-talks@rit.edu",
      category: PositionCategory.COMMITTEE_HEAD,
    },
    {
      title: "Career Development Head",
      is_primary: false,
      email: "sse-careers@rit.edu",
      category: PositionCategory.COMMITTEE_HEAD,
    },
    {
      title: "Marketing Head",
      is_primary: false,
      email: "sse-marketing@rit.edu",
      category: PositionCategory.COMMITTEE_HEAD,
    },
    // SE Office roles grant SE Admin-level access through category checks.
    {
      title: "Administrative Assistant",
      is_primary: false,
      email: "se-admin-assistant@rit.edu",
      category: PositionCategory.SE_OFFICE,
    },
    {
      title: "SE Office Head",
      is_primary: false,
      email: "se-office-head@rit.edu",
      category: PositionCategory.SE_OFFICE,
    },
    {
      title: "Undergraduate Dean",
      is_primary: false,
      email: "se-undergrad-dean@rit.edu",
      category: PositionCategory.SE_OFFICE,
    },
    {
      title: "Dean",
      is_primary: false,
      email: "se-dean@rit.edu",
      category: PositionCategory.SE_OFFICE,
    },
    {
      title: "SE Admin",
      is_primary: false,
      email: "sse-se-admin@rit.edu",
      category: PositionCategory.SE_OFFICE,
    },
  ];

  // First, clean up any old positions that don't match our canonical list
  const canonicalTitles = positions.map((p) => p.title);
  await prisma.officerPosition.deleteMany({
    where: {
      title: { notIn: canonicalTitles },
      officers: { none: {} }, // Only delete if no officers assigned
    },
  });

  // Upsert each position
  for (const pos of positions) {
    await prisma.officerPosition.upsert({
      where: { title: pos.title },
      update: {
        is_primary: pos.is_primary,
        email: pos.email,
        category: pos.category,
        is_defunct: false,
      },
      create: pos,
    });
  }

  console.log(`Seeded ${positions.length} officer positions`);
}

async function seedOfficer() {
  // Seed a test officer (President) for development
  const presidentPosition = await prisma.officerPosition.findFirst({
    where: { title: "President" },
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

function isEmptyPageContent(value: unknown) {
  if (!value) return true;
  const parsed = PageContentSchema.safeParse(value);
  return parsed.success && parsed.data.blocks.length === 0;
}

function isSeededExistingPageContent(value: unknown) {
  if (!value) return false;
  const parsed = PageContentSchema.safeParse(value);
  return (
    parsed.success &&
    parsed.data.blocks.length > 0 &&
    parsed.data.blocks.every((block) => block.id.startsWith("existing-page-"))
  );
}

async function seedExistingCmsPages() {
  const creator = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!creator) {
    console.log("Skipped CMS existing page seed: no users exist.");
    return;
  }

  const archivedLibraryOverrides = await prisma.page.updateMany({
    where: {
      OR: [{ slug: "library" }, { slug: { startsWith: "library/" } }],
      status: { not: "ARCHIVED" },
    },
    data: {
      status: "ARCHIVED",
      showInNav: false,
      navSection: "HIDDEN",
      archivedAt: new Date(),
      archivedById: creator.id,
    },
  });
  if (archivedLibraryOverrides.count > 0) {
    console.log(
      `Archived ${archivedLibraryOverrides.count} CMS library override(s); /library stays on the library app branch.`,
    );
  }

  let written = 0;
  let skipped = 0;

  for (const seed of EXISTING_CMS_PAGE_SEEDS) {
    const parsed = PageContentSchema.parse(seed.content);
    const existing = await prisma.page.findUnique({
      where: { slug: seed.slug },
    });
    const hasCustomContent =
      existing &&
      ((!isEmptyPageContent(existing.draftContent) &&
        !isSeededExistingPageContent(existing.draftContent)) ||
        (!isEmptyPageContent(existing.publishedContent) &&
          !isSeededExistingPageContent(existing.publishedContent)));

    if (hasCustomContent) {
      skipped += 1;
      continue;
    }

    const now = new Date();
    const page = await prisma.page.upsert({
      where: { slug: seed.slug },
      update: {
        title: seed.title,
        status: "PUBLISHED",
        draftContent: parsed as unknown as Prisma.InputJsonValue,
        publishedContent: parsed as unknown as Prisma.InputJsonValue,
        publishedAt: now,
        publishedById: creator.id,
        seoDescription: seed.seoDescription ?? null,
        showInNav: seed.showInNav,
        navSection: seed.navSection,
        navLabel: seed.navLabel ?? null,
        navOrder: seed.navOrder,
      },
      create: {
        slug: seed.slug,
        title: seed.title,
        status: "PUBLISHED",
        draftContent: parsed as unknown as Prisma.InputJsonValue,
        publishedContent: parsed as unknown as Prisma.InputJsonValue,
        publishedAt: now,
        publishedById: creator.id,
        seoDescription: seed.seoDescription ?? null,
        createdById: creator.id,
        showInNav: seed.showInNav,
        navSection: seed.navSection,
        navLabel: seed.navLabel ?? null,
        navOrder: seed.navOrder,
      },
    });

    await prisma.pageVersion.upsert({
      where: {
        pageId_version: {
          pageId: page.id,
          version: 1,
        },
      },
      update: {
        content: parsed as unknown as Prisma.InputJsonValue,
        contentHash: contentHash(parsed),
        publishedAt: now,
        publishedById: creator.id,
      },
      create: {
        pageId: page.id,
        version: 1,
        content: parsed as unknown as Prisma.InputJsonValue,
        contentHash: contentHash(parsed),
        publishedAt: now,
        publishedById: creator.id,
      },
    });

    written += 1;
  }

  console.log(
    `Seeded ${written} existing pages into the CMS (${skipped} already had content)`,
  );
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

  const seededTermLabel = "Spring 2026";
  const parsedSeededTerm = parseAcademicTermLabel(seededTermLabel);
  if (!parsedSeededTerm) {
    throw new Error(`Invalid seeded mentoring term label: ${seededTermLabel}`);
  }
  const { startDate: semesterStart, endDate: semesterEnd } =
    getAcademicTermDateRange(parsedSeededTerm.term, parsedSeededTerm.year);
  const applicationOpen = new Date("2025-11-15T00:00:00.000Z");
  const applicationClose = new Date("2026-01-10T00:00:00.000Z");

  const activeSemester =
    (await prisma.mentorSemester.findFirst({ where: { isActive: true } })) ??
    (await prisma.mentorSemester.create({
      data: {
        name: formatAcademicTerm(parsedSeededTerm.term, parsedSeededTerm.year),
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
    const skillCount =
      1 + Math.floor(Math.random() * Math.min(3, allSkills.length));
    const shuffledSkills = [...allSkills]
      .sort(() => Math.random() - 0.5)
      .slice(0, skillCount);
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
    const courseCount =
      1 + Math.floor(Math.random() * Math.min(2, allCourses.length));
    const shuffledCourses = [...allCourses]
      .sort(() => Math.random() - 0.5)
      .slice(0, courseCount);
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
        coursesJson: JSON.stringify(
          courseOptions[index % courseOptions.length],
        ),
        skillsText: "Java, Python, React",
        toolsComfortable: "Git, VS Code, Postman",
        toolsLearning: "Docker, Prisma",
        previousSemesters: index,
        whyMentor:
          "I want to help students feel confident in their coursework.",
        comments: "Excited to mentor and learn from others!",
        status: "PENDING",
      },
      create: {
        userId: user.id,
        semesterId: activeSemester.id,
        discordUsername: `${user.name.split(" ")[0].toLowerCase()}#${3100 + index}`,
        pronouns: "they/them",
        major: "SE",
        yearLevel: "3rd",
        coursesJson: JSON.stringify(
          courseOptions[index % courseOptions.length],
        ),
        skillsText: "Java, Python, React",
        toolsComfortable: "Git, VS Code, Postman",
        toolsLearning: "Docker, Prisma",
        previousSemesters: index,
        whyMentor:
          "I want to help students feel confident in their coursework.",
        comments: "Excited to mentor and learn from others!",
        status: "PENDING",
      },
    });
  }

  console.log(
    `Seeded ${users.length} mentor users, ${mentors.length} mentors, ${applicationUsers.length} applications`,
  );
}

async function seedTechCommitteeApplicationCycle() {
  await prisma.techCommitteeApplicationCycle.upsert({
    where: { name: "Spring 2026" },
    update: { isOpen: true },
    create: {
      name: "Spring 2026",
      isOpen: true,
    },
  });
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

  const pickRandom = <T>(items: T[], count: number) => {
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
            30,
          ),
        },
      });

      const mentorSample = pickRandom(
        mentors,
        randomInt(1, Math.min(3, mentors.length)),
      );
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
            55,
          ),
        },
      });

      const menteeMentors = pickRandom(
        mentors,
        randomInt(1, Math.min(3, mentors.length)),
      );
      for (const mentor of menteeMentors) {
        await prisma.menteeHeadcountMentor.create({
          data: {
            entryId: menteeEntry.id,
            mentorId: mentor.id,
          },
        });
      }

      if (courses.length > 0) {
        const courseSample = pickRandom(
          courses,
          randomInt(1, Math.min(2, courses.length)),
        );
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
      start_date: "Fall 2017",
      end_date: "Spring 2023",
      previous_roles: "President",
      quote: "01001000 01100101 01101100 01101100 01101111",
      showEmail: true,
      receiveEmails: true,
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
      start_date: "Spring 2020",
      end_date: "Fall 2025",
      previous_roles: "Tech Head, Vice President",
      quote: "Pinapple on pizza <3",
      showEmail: true,
      receiveEmails: true,
    },
  });

  const alumni3 = await prisma.alumni.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: "Alex Chen",
      email: "alex.chen@rit.edu",
      linkedIn: "alexchen",
      gitHub: "alexchen",
      description:
        "Former Events Head. Loved running hackathons and game nights.",
      start_date: "Fall 2019",
      end_date: "Spring 2022",
      previous_roles: "Events Head",
      quote: "I once went here every day",
      showEmail: false,
      receiveEmails: true,
    },
  });

  const alumni4 = await prisma.alumni.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: "Jordan Lee",
      email: "jordan.lee@rit.edu",
      linkedIn: "jordanlee",
      gitHub: "jordanlee",
      description: "Mentoring and career dev were my focus. Now in FAANG.",
      start_date: "Spring 2018",
      end_date: "Fall 2021",
      previous_roles: "Mentoring Head, Career Development Head",
      quote: "SSE gave me my first real network.",
      showEmail: true,
      receiveEmails: true,
    },
  });

  const alumni5 = await prisma.alumni.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      name: "Sam Rivera",
      email: "sam.rivera@rit.edu",
      linkedIn: "samrivera",
      gitHub: "samrivera",
      description: "Lab ops and projects. Built a lot of the physical space.",
      start_date: "Fall 2020",
      end_date: "Spring 2024",
      previous_roles: "Lab Ops Head, Projects Head",
      quote: "Best community at RIT.",
      showEmail: true,
      receiveEmails: false,
    },
  });

  console.log({ alumni1, alumni2, alumni3, alumni4, alumni5 });
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
      completed: false,
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
      completed: false,
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
      completed: false,
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
  console.log({
    projectContributor1,
    projectContributor2,
    projectContributor3,
  });
}

async function seedEvents() {
  const seededEventIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  await prisma.event.deleteMany({
    where: {
      id: {
        in: seededEventIds,
      },
    },
  });

  const event1 = await prisma.event.create({
    data: {
      id: "1",
      title: "Keeping it Silly",
      date: new Date("2023-11-1 12:00:00"),
      description: "we keep it silly :3",
      attendanceEnabled: false,
      grantsMembership: false,
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
      attendanceEnabled: false,
      grantsMembership: false,
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
      attendanceEnabled: false,
      grantsMembership: false,
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
      attendanceEnabled: false,
      grantsMembership: false,
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
      attendanceEnabled: false,
      grantsMembership: false,
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
      attendanceEnabled: false,
      grantsMembership: false,
    },
  });

  // Purpose-built attendance/membership QA events
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  const event7 = await prisma.event.create({
    data: {
      id: "7",
      title: "don't attend this!",
      date: new Date(now - oneHour),
      description:
        "Past event with attendance + membership grant enabled for reconciliation tests.",
      location: "GCCIS 2130",
      attendanceEnabled: true,
      grantsMembership: true,
    },
  });

  const event8 = await prisma.event.create({
    data: {
      id: "8",
      title: "attend this!",
      date: new Date(now + oneHour),
      description:
        "Upcoming event with attendance + membership grant enabled for early check-in and pending membership tests.",
      location: "GCCIS 2140",
      attendanceEnabled: true,
      grantsMembership: true,
    },
  });

  const event9 = await prisma.event.create({
    data: {
      id: "9",
      title: "Attendance QA - Past No Membership",
      date: new Date(now - 2 * oneHour),
      description:
        "Past event with attendance enabled but no membership grant.",
      location: "GCCIS 2150",
      attendanceEnabled: true,
      grantsMembership: false,
    },
  });

  const seedAttendanceIds = ["1"];

  await prisma.event.deleteMany({
    where: {
      id: {
        in: seedAttendanceIds,
      },
    },
  });

  const attendance1 = await prisma.eventAttendance.create({
    data: {
      eventId: event7.id,
      userId: 2,
    },
  });

  console.log({
    event1,
    event2,
    event3,
    event4,
    event5,
    event6,
    event7,
    event8,
    event9,
    attendance1,
  });
}

async function seedMemberships() {
  // Spread across multiple terms so fixtures exercise the per-term
  // lookup paths. Multiple rows per (userId, term, year) are allowed —
  // there's intentionally no unique constraint on that tuple.
  const rows: Array<{
    userId: number;
    reason: string;
    dateGiven: Date;
    term: "SPRING" | "SUMMER" | "FALL";
    year: number;
  }> = [
    {
      userId: 1,
      reason: "Test1",
      dateGiven: new Date("2024-10-01 12:00:00"),
      term: "FALL",
      year: 2024,
    },
    {
      userId: 2,
      reason: "Test2",
      dateGiven: new Date("2024-10-02 12:00:00"),
      term: "FALL",
      year: 2024,
    },
    {
      userId: 1,
      reason: "Test3",
      dateGiven: new Date("2025-02-02 12:00:00"),
      term: "SPRING",
      year: 2025,
    },
    {
      userId: 1,
      reason: "Test4",
      dateGiven: new Date("2025-10-03 12:00:00"),
      term: "FALL",
      year: 2025,
    },
    {
      userId: 3,
      reason: "Test5",
      dateGiven: new Date("2026-02-04 12:00:00"),
      term: "SPRING",
      year: 2026,
    },
  ];
  // Idempotent re-seed: skip rows whose exact (userId, reason, term, year)
  // already exists. Without a unique constraint we can't use upsert, but
  // the (reason, term, year) tuple is distinctive enough across the
  // fixture set above to act as a stable "have we seeded this?" key.
  for (const row of rows) {
    const existing = await prisma.memberships.findFirst({
      where: {
        userId: row.userId,
        reason: row.reason,
        term: row.term,
        year: row.year,
      },
      select: { id: true },
    });
    if (!existing) {
      await prisma.memberships.create({ data: row });
    }
  }
  console.log(
    `seedMemberships: ${rows.length} memberships across ` +
      `Fall 2024 / Spring 2025 / Fall 2025 / Spring 2026`,
  );
}

async function seedSponsors() {
  const sponsor1 = await prisma.sponsor.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Golisano College",
      description:
        "RIT's College of Computing and Information Sciences, home to SSE.",
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
      description:
        "A regional bank providing financial services across the Northeast.",
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
      description:
        "A Rochester-based technology company specializing in IT solutions.",
      logoUrl: "/images/sponsors/mindex.png",
      websiteUrl: "https://www.mindex.com/",
      isActive: true,
    },
  });

  console.log({ sponsor1, sponsor2, sponsor3 });
}

async function seedTextbooks() {
  await prisma.textbookCopies.deleteMany({}); // Clear dependent copies first
  await prisma.textbooks.deleteMany({}); // Clear existing textbooks
  // Truncate the ID sequence to start from 1 again

  const textbook1 = await prisma.textbooks.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Rapid Development: Taming Wild Software Schedules",
      description:
        "In Rapid Development, software industry guru Steve McConnell offers field-tested techniques to help you dramatically accelerate your development schedule--without sacrificing quality. Drawing on a rich trove of case studies and examples from his own consulting practice, McConnell identifies the most effective strategies for streamlining every phase of the development process.",
      authors: "Steve McConnell",
      image: "/library-assets/9781556159006.jpg",
      ISBN: "9781556159006",
      edition: "",
      publisher: "Pearson Education",
      yearPublished: "1996",
      keyWords:
        "software development, project management, software engineering",
      classInterest: "SWEN-256",
    },
  });

  const textbook2 = await prisma.textbooks.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Design Patterns: Elements of Reusable Object-Oriented Software",
      description:
        "Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems. Previously undocumented, these 23 patterns allow designers to create more flexible, elegant, and ultimately reusable designs without having to rediscover the design solutions themselves.",
      authors: "Erich Gamma; Richard Helm; Ralph Johnson; John Vlissides",
      image: "/library-assets/9780201633610.jpg",
      ISBN: "9780201633610",
      edition: "1",
      publisher: "Addison-Wesley Professional",
      yearPublished: "1994",
      keyWords:
        "software design, software engineering, object-oriented programming",
      classInterest: "SWEN-262",
    },
  });

  const textbook3 = await prisma.textbooks.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: "C Programming Language, 2nd Edition",
      description:
        "Learn how to program in C from the developers of C, Brian Kernighan and Dennis Ritchie. Intended for those with at least some experience with one other language (even if you are a novice), this book contains a tutorial introduction to get new users started as soon as possible and separate chapters on each major feature.",
      authors: "Brian W. Kernighan; Dennis M. Ritchie",
      image: "/library-assets/9780131103627.jpg",
      ISBN: "9780131103627",
      edition: "2",
      publisher: "Pearson",
      yearPublished: "1988",
      keyWords: "C programming, software development, programming languages",
      classInterest: "SWEN-250, SWEN-340",
    },
  });

  const textbook4 = await prisma.textbooks.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: "Probability and Statistics for Engineering and the Sciences",
      description:
        "Put statistical theories into practice with PROBABILITY AND STATISTICS FOR ENGINEERING AND THE SCIENCES, 9th Edition. Always a favorite with statistics students, this calculus-based text offers a comprehensive introduction to probability and statistics while demonstrating how professionals apply concepts, models, and methodologies in today's engineering and scientific careers. Jay Devore, an award-winning professor and internationally recognized author and statistician, emphasizes authentic problem scenarios in a multitude of examples and exercises, many of which involve real data, to show how statistics makes sense of the world. Mathematical development and derivations are kept to a minimum. The book also includes output, graphics, and screen shots from various statistical software packages to give you a solid perspective of statistics in action. A Student Solutions Manual, which includes worked-out solutions to almost all the odd-numbered exercises in the book, is available.",
      authors: "Jay L. Devore",
      image: "/library-assets/9781305251809.jpg",
      ISBN: "9781305251809",
      edition: "9",
      publisher: "Cengage Learning",
      yearPublished: "2015",
      keyWords: "probability, statistics, engineering",
      classInterest: "MATH-251",
    },
  });

  const textbook1copy1 = await prisma.textbookCopies.upsert({
    where: { id: 1 },
    update: {},
    create: {
      ISBN: "9781556159006",
      checkedOut: false,
    },
  });

  console.log({ textbook1, textbook2, textbook3, textbook4 });
  console.log({ textbook1copy1 });
}

async function seedCategories() {
  await prisma.bookCategory.deleteMany({}); // Clear existing categories

  const categories = ["Software Engineering", "Computer Science"];

  let count = 1;

  for (const category of categories) {
    await prisma.bookCategory.upsert({
      where: { categoryName: category, id: count },
      update: {},
      create: { categoryName: category, id: count },
    });
    count++;
  }

  await prisma.bookCategory.update({
    where: { categoryName: "Software Engineering", id: 1 },
    data: {
      books: [1, 2],
    },
  });
}

/**
 * Dev-only demo election — a competitive election that has just finished
 * voting and is waiting on SE Office certification. Shows off:
 *   - Four primary offices (post-Amendment 13)
 *   - Amendment 12 running-mate tickets (one accepted, one pending)
 *   - A competitive 3-way President race that goes to IRV round 2 with
 *     vote transfers (so the Sankey actually flows)
 *   - 2-way races for Secretary / Treasurer / Mentoring Head
 *   - 90 ballots cast, none counted yet — SE Office needs to certify.
 *
 * The function nukes the previous demo election each time so the seed
 * stays deterministic regardless of prior Tweaks-panel fiddling.
 */
async function seedDemoElection() {
  const demoSlug = "spring-2026-demo";
  const now = new Date();
  const past = (minutesAgo: number) =>
    new Date(now.getTime() - minutesAgo * 60 * 1000);
  const future = (minutesAhead: number) =>
    new Date(now.getTime() + minutesAhead * 60 * 1000);

  // 1. Cascading delete of the existing demo (if any). FK cascades handle
  //    offices → nominations → ballot rankings → ballots → running-mate
  //    invitations. Voter users stay around — deleting them is messy and
  //    they're cheap to leave behind.
  await prisma.election.deleteMany({ where: { slug: demoSlug } });

  // 2. Upsert the cast of named nominees + running mates.
  const demoNames = [
    { email: "ari.chen@rit.edu", name: "Ari Chen" }, // 0 · pres (wins)
    { email: "jordan.park@rit.edu", name: "Jordan Park" }, // 1 · pres (runner-up)
    { email: "sam.delacroix@rit.edu", name: "Sam Delacroix" }, // 2 · pres (eliminated round 1)
    { email: "mel.okonkwo@rit.edu", name: "Mel Okonkwo" }, // 3 · Ari's accepted VP
    { email: "kai.bergstrom@rit.edu", name: "Kai Bergstrom" }, // 4 · sec + Jordan's pending VP
    { email: "liv.amara@rit.edu", name: "Liv Amara" }, // 5 · treasurer
    { email: "nova.ashcroft@rit.edu", name: "Nova Ashcroft" }, // 6 · mentoring head
    { email: "tam.robinson@rit.edu", name: "Tam Robinson" }, // 7 · secretary
    { email: "zee.patel@rit.edu", name: "Zee Patel" }, // 8 · treasurer
    { email: "omar.velez@rit.edu", name: "Omar Velez" }, // 9 · mentoring head
  ];
  const users: { id: number; name: string; email: string }[] = [];
  for (const u of demoNames) {
    const row = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email },
    });
    users.push({ id: row.id, name: row.name, email: row.email });
  }
  const uid = (ix: number) => users[ix]!.id;

  // 3. Primary officer positions keyed by the canonical titles.
  // Vice President is included so the ElectionOffice exists even though
  // it carries no nominations — it's ticket-derived and the tally
  // helpers / reveal slide depend on the office row being present.
  const officeTitles = [
    "President",
    "Vice President",
    "Secretary",
    "Treasurer",
    "Mentoring Head",
  ];
  const positions = await prisma.officerPosition.findMany({
    where: { title: { in: officeTitles } },
  });
  if (positions.length !== officeTitles.length) {
    console.warn(
      `seedDemoElection: expected ${officeTitles.length} positions (inc. VP), ` +
        `found ${positions.length}. Skipping demo election seed.`,
    );
    return;
  }

  // 4. Create the election in VOTING_CLOSED state with all cutoffs in the
  //    past. Certification is the last step — we intentionally leave
  //    `certifiedById` null so the SE Office certify CTA surfaces.
  const election = await prisma.election.create({
    data: {
      title: "Spring 2026 Primary Elections",
      slug: demoSlug,
      description:
        "Voting has closed — the SE Office must certify these results.",
      status: "VOTING_CLOSED",
      nominationsOpenAt: past(60 * 24 * 7), // 1 week ago
      nominationsCloseAt: past(60 * 24 * 4), // 4 days ago
      votingOpenAt: past(60 * 24 * 2), // 2 days ago
      votingCloseAt: past(60), // 1 hour ago
      createdById: uid(0),
    },
  });

  // 5. Create one ElectionOffice per primary title.
  const officeByTitle = new Map<string, number>();
  for (const position of positions) {
    const office = await prisma.electionOffice.create({
      data: {
        electionId: election.id,
        officerPositionId: position.id,
      },
    });
    officeByTitle.set(position.title, office.id);
  }

  // 6. Nominations — all ACCEPTED + APPROVED. Keyed map so we can look
  //    up nomination ids by (office, nominee) when building ballots.
  const nomPlan: Array<{
    office: string;
    nominees: number[];
    nominator: number;
    statements: Record<number, string>;
  }> = [
    {
      office: "President",
      nominees: [uid(0), uid(1), uid(2)],
      nominator: uid(7),
      statements: {
        [uid(0)]:
          "Current Talks Head. 2 terms as a mentor. Big on sustainability and paying it forward.",
        [uid(1)]:
          "Current VP. Built the new scoreboard. Wants SSE to feel like home for first-years.",
        [uid(2)]:
          'Lab Ops Head. Runs Rapid Dev. Self-described "library gremlin".',
      },
    },
    {
      office: "Secretary",
      nominees: [uid(4), uid(7)],
      nominator: uid(0),
      statements: {
        [uid(4)]: "Runs the SSE discord & socials. Brand-obsessed.",
        [uid(7)]: "Minutes-taker extraordinaire. Good writer.",
      },
    },
    {
      office: "Treasurer",
      nominees: [uid(5), uid(8)],
      nominator: uid(0),
      statements: {
        [uid(5)]: "Already runs merch ops. QuickBooks enjoyer.",
        [uid(8)]: "Winter Ball budget lead for 2 years.",
      },
    },
    {
      office: "Mentoring Head",
      nominees: [uid(6), uid(9)],
      nominator: uid(0),
      statements: {
        [uid(6)]: 'Mentor for 5 terms. Invented "office hours bingo".',
        [uid(9)]: "SWEN-262 TA. Patient, methodical.",
      },
    },
  ];

  // nominationIdByUser[officeTitle][userId] → nomination id
  const nomId = new Map<string, Map<number, number>>();
  for (const slot of nomPlan) {
    const officeId = officeByTitle.get(slot.office)!;
    const innerMap = new Map<number, number>();
    for (const nomineeId of slot.nominees) {
      const row = await prisma.electionNomination.create({
        data: {
          electionOfficeId: officeId,
          nomineeUserId: nomineeId,
          nominatorUserId: slot.nominator,
          status: "ACCEPTED",
          eligibilityStatus: "APPROVED",
          statement: slot.statements[nomineeId] ?? "Seeded demo nominee.",
          yearLevel: 3,
          program: "Software Engineering",
          canRemainEnrolledFullYear: true,
          canRemainEnrolledNextTerm: true,
          isOnCampus: true,
          isOnCoop: false,
          reviewedAt: past(60 * 48),
          reviewedById: uid(0),
        },
      });
      innerMap.set(nomineeId, row.id);
    }
    nomId.set(slot.office, innerMap);
  }

  // 7. Amendment 12 running-mate invitations.
  //    Ari (uid 0) → Mel (uid 3) ACCEPTED
  //    Jordan (uid 1) → Kai (uid 4) INVITED (pending)
  //    Sam (uid 2) → no invitation
  const presMap = nomId.get("President")!;
  await prisma.electionRunningMateInvitation.create({
    data: {
      presidentNominationId: presMap.get(uid(0))!,
      inviteeUserId: uid(3),
      status: "ACCEPTED",
      respondedAt: past(60 * 36),
      expiresAt: past(60 * 35),
    },
  });
  await prisma.electionRunningMateInvitation.create({
    data: {
      presidentNominationId: presMap.get(uid(1))!,
      inviteeUserId: uid(4),
      status: "INVITED",
      expiresAt: future(60 * 4),
    },
  });

  // 8. Create 90 anonymous voter users (upsert so repeat seed runs reuse
  //    them). These represent active members who cast ballots.
  const voters: number[] = [];
  for (let i = 0; i < 90; i++) {
    const email = `demo-voter-${String(i + 1).padStart(2, "0")}@sse-demo.rit.edu`;
    const row = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { name: `Demo Voter ${i + 1}`, email },
    });
    voters.push(row.id);
  }

  // 9. Ballot pattern generator. Each voter gets a ranking for every
  //    office. Distributions are chosen to produce a competitive IRV
  //    runoff on the President race (Ari 42 → 54, Jordan 28 → 36, Sam 20
  //    eliminated round 1 with votes transferring 12 → Ari, 8 → Jordan).
  const pres = (i: number): number[] => {
    if (i < 32) return [uid(0), uid(1), uid(2)]; // 32 × Ari > Jordan > Sam
    if (i < 42) return [uid(0), uid(2), uid(1)]; // 10 × Ari > Sam > Jordan
    if (i < 62) return [uid(1), uid(0), uid(2)]; // 20 × Jordan > Ari > Sam
    if (i < 70) return [uid(1), uid(2), uid(0)]; //  8 × Jordan > Sam > Ari
    if (i < 82) return [uid(2), uid(0), uid(1)]; // 12 × Sam > Ari > Jordan
    return [uid(2), uid(1), uid(0)]; //  8 × Sam > Jordan > Ari
  };
  // Secretary: Kai 50, Tam 40 — simple majority, 1 round.
  const sec = (i: number): number[] =>
    i < 50 ? [uid(4), uid(7)] : [uid(7), uid(4)];
  // Treasurer: Liv 48, Zee 42 — simple majority, 1 round.
  const treas = (i: number): number[] =>
    i < 48 ? [uid(5), uid(8)] : [uid(8), uid(5)];
  // Mentoring Head: Nova 55, Omar 35 — comfortable majority, 1 round.
  const ment = (i: number): number[] =>
    i < 55 ? [uid(6), uid(9)] : [uid(9), uid(6)];

  // 10. Insert ballots + rankings. Use createMany per ballot for speed.
  for (let i = 0; i < voters.length; i++) {
    const voterId = voters[i]!;
    const ballot = await prisma.electionBallot.create({
      data: { electionId: election.id, voterId },
    });

    const rankings: {
      ballotId: number;
      electionOfficeId: number;
      nominationId: number;
      rank: number;
    }[] = [];
    const pushOffice = (officeTitle: string, nomineeOrder: number[]) => {
      const officeId = officeByTitle.get(officeTitle)!;
      const innerMap = nomId.get(officeTitle)!;
      nomineeOrder.forEach((nomineeUserId, idx) => {
        const nominationId = innerMap.get(nomineeUserId);
        if (!nominationId) return;
        rankings.push({
          ballotId: ballot.id,
          electionOfficeId: officeId,
          nominationId,
          rank: idx + 1,
        });
      });
    };
    pushOffice("President", pres(i));
    pushOffice("Secretary", sec(i));
    pushOffice("Treasurer", treas(i));
    pushOffice("Mentoring Head", ment(i));
    await prisma.electionBallotRanking.createMany({ data: rankings });
  }

  console.log(
    `seedDemoElection: created competitive VOTING_CLOSED /elections/${demoSlug} ` +
      `— 5 offices (incl. ticket-derived VP), ${nomPlan.reduce((a, s) => a + s.nominees.length, 0)} nominees, ` +
      `${voters.length} ballots cast, awaiting SE Office certification.`,
  );
}

async function main() {
  try {
    // Core data seeding
    await seedUser(); // Test users for development only

    await seedTextbooks();
    await seedCategories();

    await seedQuote();
    await seedOfficerPosition(); // Officer positions (can exist without officers)
    await seedOfficer(); // Test officer assignment for development
    await seedExistingCmsPages(); // Published CMS translations of existing public pages
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
    await seedTechCommitteeApplicationCycle();
    await seedEvents();
    await seedMemberships();
    await seedSponsors();
    await seedDemoElection();
  } catch (e) {
    console.error(e);
    throw e;
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
