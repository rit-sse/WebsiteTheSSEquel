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
async function seedOfficerPosition() { }

//Garrett
async function seedOfficer() { }

//Abigail
async function seedMentor() {
    const mentor_1 = await prisma.mentor.upsert({
        where: { id: 1 },
        update: {},
        create: {
            user_Id: 1,
            expirationDate: new Date(2025, 4, 5),
            isActive: true,
        }
    });
    const mentor_2 = await prisma.mentor.upsert({
        where: {id: 2},
        update: {},
        create: {
            user_Id: 2,
            expirationDate: new Date(2023, 10, 20),
            isActive: false,
        }
    });
    console.log({ mentor_1, mentor_2 });
}

//Abigail
async function seedSkill() { 
    const skill_ballin = await prisma.skill.upsert({
        where: {id: 1},
        update: {},
        create: {
            skill: "Ballin'"
        }
    });
    const skill_sooubway = await prisma.skill.upsert({
        where: {id: 2},
        update: {},
        create: {
            skill: "Sandwich Artistry"
        }
    });
    const skill_stealth = await prisma.skill.upsert({
        where: {id: 3},
        update: {},
        create: {
            skill: "Stealth"
        }
    })
    console.log({ skill_ballin, skill_sooubway, skill_stealth });
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
