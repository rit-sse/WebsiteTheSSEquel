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
    console.log({ president })
}

//Garrett
async function seedOfficer() { }

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
