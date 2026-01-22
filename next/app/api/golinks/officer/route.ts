import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'

export async function GET() {
    const goLinks = await prisma.goLinks.findMany({ where: { isPublic: false } })
    return Response.json(goLinks)
}
