import prisma from "@/lib/prisma";

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