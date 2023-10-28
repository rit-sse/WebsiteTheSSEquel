import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
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
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
