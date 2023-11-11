import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient()

export async function POST(request: Request) {
    const body = await request.json();
    if (!("url" in body && "golink" &&"description"&&"isPinned"&&"isPublic" in body)) {
      return new Response(
        ' "golink","desxription","isPinned" and "isPublic" are all required',
        { status: 400 }
      );
    }

    // TODO: Validate the titles
    const golink = body.golink;
    const url=body.url;
    const description=body.description;
    const isPublic=body.isPublic;
    const isPinned=body.isPinned;
    const newGolink= await prisma.goLinks.create({
      data: { 
        golink: golink,
        url: url,
        description:description,
        isPublic: isPublic,
        isPinned: isPinned,
        updatedAt: (new Date).toISOString(),
      }
    });
    return Response.json(newGolink);
}

