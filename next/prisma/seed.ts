import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function seedUser() {
    const johndoe = await prisma.user.upsert({
        where: { email: 'johndoe@rit.edu' },
        update: {},
        create: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'johndoe@rit.edu'
        },
    })
    const janedoe = await prisma.user.upsert({
        where: { email: 'janedoe@rit.edu' },
        update: {},
        create: {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'janedoe@rit.edu'
        },
    })
    const johnsmith = await prisma.user.upsert({
        where: { email: 'johnsmith@rit.edu' },
        update: {},
        create: {
            firstName: 'John',
            lastName: 'Smith',
            email: 'johnsmith@rit.edu'
        },
    })
    console.log({ johndoe, janedoe, johnsmith })
}

async function seedQuote() {
    const quote1 = await prisma.quote.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            date_added: new Date(),
            quote: 'This is a quote',
            user_id: 1,
        }
    })

    const quote2 = await prisma.quote.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            date_added: new Date(),
            quote: 'This is another quote',
            user_id: 2,
        }
    })

    const quote3 = await prisma.quote.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            date_added: new Date(),
            quote: 'This is a third quote',
            user_id: 3,
        }
    })

    console.log({ quote1, quote2, quote3 })
}

async function seedOfficerPosition() {
    const president = await prisma.officerPosition.upsert({
        where: { id: 1 },
        update: {},
        create: {
            title: 'President',
            is_primary: true,
            email: 'sse-president@rit.edu'
        },
    })
    const vicePresident = await prisma.officerPosition.upsert({
        where: { id: 2 },
        update: {},
        create: {
            title: 'Vice President',
            is_primary: false,
            email: 'sse-vicepresident@rit.edu'
        },
    })

    const techHead = await prisma.officerPosition.upsert({
        where: { id: 3 },
        update: {},
        create: {
            title: 'Tech Head',
            is_primary: false,
            email: 'sse-tech@rit.edu'
        },
    })
    console.log({ president, vicePresident, techHead })
}

async function seedOfficer() {
    const officer1 = await prisma.officer.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            position_id: 1,
            user_id: 1,
            is_active: true,
            start_date: new Date(),
            end_date: new Date(),
        },
    })

    const officer2 = await prisma.officer.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            position_id: 2,
            user_id: 2,
            is_active: true,
            start_date: new Date(),
            end_date: new Date(),
        },
    })

    const officer3 = await prisma.officer.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            position_id: 3,
            user_id: 1,
            is_active: false,
            start_date: new Date(),
            end_date: new Date(),
        },
    })
    console.log({ officer1, officer2, officer3 })
}

async function seedMentor() {
    const mentor1 = await prisma.mentor.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            user_Id: 1,
            expirationDate: new Date(),
            isActive: true,
        },
    })
    const mentor2 = await prisma.mentor.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            user_Id: 2,
            expirationDate: new Date(),
            isActive: true,
        },
    })

    const mentor3 = await prisma.mentor.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            user_Id: 3,
            expirationDate: new Date(),
            isActive: true,
        },
    })
    console.log({ mentor1, mentor2, mentor3 })
}

async function seedSkill() {
    const java = await prisma.skill.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            skill: 'Java',
        },
    })

    const cpp = await prisma.skill.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            skill: 'c++',
        },
    })

    const python = await prisma.skill.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            skill: 'Python',
        },
    })
    console.log({ java, cpp, python })
}

async function seedMentorSkill() {
    const mentorSkill1 = await prisma.mentorSkill.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            mentor_Id: 1,
            skill_Id: 1,
        },
    })

    const mentorSkill2 = await prisma.mentorSkill.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            mentor_Id: 2,
            skill_Id: 2,
        },
    })

    const mentorSkill3 = await prisma.mentorSkill.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            mentor_Id: 3,
            skill_Id: 3,
        },
    })

    console.log({ mentorSkill1, mentorSkill2, mentorSkill3 })
}

//Joe
async function seedDepartment() {
    const department1 = await prisma.department.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            title: 'Computer Science',
        },
    })
    const department2 = await prisma.department.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            title: 'Software Engineering',
        },
    })
    const department3 = await prisma.department.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            title: 'Interactive Games and Media',
        },
    })
    console.log({ department1, department2, department3 })
}

//Joe
async function seedCourse() {
    const course1 = await prisma.course.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            title: 'Software Development I',
            departmentId: 2,
            code: 123,
        },
    })
    const course2 = await prisma.course.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            title: 'Software Development II',
            departmentId: 2,
            code: 124
        },
    })
    const course3 = await prisma.course.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            title: 'CS For AP Students',
            departmentId: 1,
            code: 140
        },
    })
    console.log({ course1, course2, course3 })
}

async function seedCourseTaken() {
    const courseTaken1 = await prisma.courseTaken.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            mentorId: 1,
            courseId: 1,
        },
    })
    const courseTaken2 = await prisma.courseTaken.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            mentorId: 2,
            courseId: 2,
        },
    })
    const courseTaken3 = await prisma.courseTaken.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            mentorId: 3,
            courseId: 3,
        },
    })
    console.log({ courseTaken1, courseTaken2, courseTaken3 })
}

async function seedHourBlock() {
    const hourBlock1 = await prisma.hourBlock.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            weekday: 'Monday',
            startTime: new Date('2023-11-1 12:00:00'),
        },
    })
    const hourBlock2 = await prisma.hourBlock.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            weekday: 'Tuesday',
            startTime: new Date('2023-11-2 12:00:00'),
        },
    })
    const hourBlock3 = await prisma.hourBlock.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            weekday: 'Wednesday',
            startTime: new Date('2023-11-3 12:00:00'),
        },
    })
    console.log({ hourBlock1, hourBlock2, hourBlock3 })
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
    })
    const schedule2 = await prisma.schedule.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            mentorId: 2,
            hourBlockId: 2,
        },
    })
    const schedule3 = await prisma.schedule.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            mentorId: 3,
            hourBlockId: 3,
        },
    })
    console.log({ schedule1, schedule2, schedule3 })
}

async function seedGoLinks() {
    const goLink1 = await prisma.goLinks.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            golink: 'sse',
            url: 'sse.rit.edu',
            description: 'SSE Website',
            createdAt: new Date(),
            updatedAt: new Date(),
            isPublic: true,
            authorId: 1,
            isPinned: true,
        },
    })
    const goLink2 = await prisma.goLinks.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            golink: 'google',
            url: 'google.com',
            description: 'An underground and unknown search engine',
            createdAt: new Date(),
            updatedAt: new Date(),
            isPublic: true,
            authorId: 2,
            isPinned: true,
        },
    })
    const goLink3 = await prisma.goLinks.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            golink: 'youtube',
            url: 'youtube.com',
            description: 'A small video sharing website',
            createdAt: new Date(),
            updatedAt: new Date(),
            isPublic: true,
            authorId: 3,
            isPinned: true,
        },
    })
    console.log({ goLink1, goLink2, goLink3 })
}

async function seedAccount() {
    const account1 = await prisma.account.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            userId: 1,
            type: 'google',
            provider: 'google.com',
            providerAccountId: '123',
            refreshToken: '123',
            accessToken: '123',
            accessTokenExpires: new Date(),
            tokenType: '123',
            scope: '123',
            idToken: '123',
            sessionState: '123',
        }
    })
    const account2 = await prisma.account.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            userId: 2,
            type: 'google',
            provider: 'google.com',
            providerAccountId: '123',
            refreshToken: '123',
            accessToken: '123',
            accessTokenExpires: new Date(),
            tokenType: '123',
            scope: '123',
            idToken: '123',
            sessionState: '123',
        }
    })
    const account3 = await prisma.account.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            userId: 3,
            type: 'google',
            provider: 'google.com',
            providerAccountId: '123',
            refreshToken: '123',
            accessToken: '123',
            accessTokenExpires: new Date(),
            tokenType: '123',
            scope: '123',
            idToken: '123',
            sessionState: '123',
        }
    })
    console.log({ account1, account2, account3 })
}

async function seedSession() {
    const session1 = await prisma.session.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            expires: new Date(),
            sessionToken: '123',
            userId: 1,
        }
    })
    const session2 = await prisma.session.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            expires: new Date(),
            sessionToken: '124',
            userId: 2,
        }
    })

    const session3 = await prisma.session.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            expires: new Date(),
            sessionToken: '125',
            userId: 3,
        }
    })
    console.log({ session1, session2, session3 })
}

async function seedVerificationToken() {
    const verificationToken1 = await prisma.verificationToken.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            identifier: 'sadsad',
            token: '123',
            expires: new Date(),
        }
    })
    const verificationToken2 = await prisma.verificationToken.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            identifier: 'qwewqr',
            token: '124',
            expires: new Date(),
        }
    })
    const verificationToken3 = await prisma.verificationToken.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            identifier: 'wsx',
            token: '125',
            expires: new Date(),
        }
    })
    console.log({ verificationToken1, verificationToken2, verificationToken3 })
}


async function main() {
    const list = [seedUser(),
    seedQuote(),
    seedOfficerPosition(),
    seedOfficer(),
    seedMentor(),
    seedSkill(),
    seedMentorSkill(),
    seedDepartment(),
    seedCourse(),
    seedCourseTaken(),
    seedHourBlock(),
    seedSchedule(),
    seedGoLinks(),
    seedAccount(),
    seedSession(),
    seedVerificationToken()]
    for (const i of list) {
        await i
    }
}




main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
