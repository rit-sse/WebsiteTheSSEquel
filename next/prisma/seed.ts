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

async function seedQuote() { }

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
        where: { id: 1 },
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

async function seedCourseTaken() { }


async function main() {
    seedUser()
    seedOfficerPosition()
    seedOfficer()
    seedMentor()
    seedSkill()
    seedMentorSkill()
    seedDepartment()
    seedCourse()

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
