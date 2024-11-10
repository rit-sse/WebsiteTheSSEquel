import { PrismaClient } from "@prisma/client"

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET() {
    const goLinks = await prisma.goLinks.findMany({ where: { isPublic: false } })
    return Response.json(goLinks)
}
