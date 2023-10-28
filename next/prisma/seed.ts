import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

//Anderson
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

//Anderson
async function seedQuote() { }

//Joe
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

//Joe
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
//Joe
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

//Joe
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

//Garrett
async function seedMentorSkill() { }

//Joe
async function seedDepartment() { }

//Joe
async function seedCourse() { }

//Anderson
async function seedCourseTaken() { }


async function main() {
    seedUser()
    seedOfficerPosition()
    seedOfficer()
    seedMentor()
    seedSkill()

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
