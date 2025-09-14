import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getEvents(){
    try{
    const allEvents = await prisma.event.findMany({
        select: {
            id: true,
            title: true,
            description: true,
            date: true,
            image: true,
            location: true,
        },
        });
    return allEvents;
  }
  catch{
    return null;
  }
}