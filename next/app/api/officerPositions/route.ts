import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();
/**
 * HTTP GET request to /api/officer
 * Gets all officer positions
 * @returns [{id: number, title: string, is_primary: boolean, email: string}]
 */
export async function GET() {
    const officerRoles = await prisma.officerPosition.findMany();
    return Response.json(officerRoles);
}