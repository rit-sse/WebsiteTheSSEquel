import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    const officer = await prisma.officer.findMany()
    return Response.json(officer)
}