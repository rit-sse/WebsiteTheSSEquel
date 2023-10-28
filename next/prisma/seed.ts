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
    console.log({ johndoe })
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

//Garrett
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
    console.log({ officer1 })
}
//Abigail
async function seedMentor() { }

//Abigail
async function seedSkill() { }

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
