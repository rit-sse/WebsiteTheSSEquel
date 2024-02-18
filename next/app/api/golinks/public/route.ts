import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    const goLinks = await prisma.goLinks.findMany({ where: { isPublic: true } })
    return Response.json(goLinks)
}