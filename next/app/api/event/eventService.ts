import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getEvents(){
    try{
    const allEvents = await prisma.event.findMany({
        select: {
            id: true,
            title: true,
            date: true,
            description: true,
            image: true,
            location: true,
        },
        });
        // console.log(allEvents);
    return allEvents;
  }
  catch{
    return null;
  }
}