import { PrismaClient } from "@prisma/client";
// import { updateData } from "./yourUpdateDataFile"; // Import the updateData function

const prisma = new PrismaClient();

export async function GET() {
    const goLinkData = await prisma.goLinks.findMany({ where: { isPublic: true } });
    return goLinkData;
}
  
const goLinkData = GET();

export default goLinkData;