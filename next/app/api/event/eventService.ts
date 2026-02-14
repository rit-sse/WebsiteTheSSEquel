import { getPayloadClient } from "@/lib/payload";
import { resolveMediaURL } from "@/lib/payloadCms";

export async function getEvents(){
    try {
      const payload = await getPayloadClient();
      const allEvents = await payload.find({
        collection: "events",
        depth: 1,
        limit: 1000,
        sort: "-date",
      });

      return allEvents.docs.map((doc) => {
        const typed = doc as Record<string, any>;
        return {
          id: String(typed.id),
          title: typed.title ?? "",
          description: typed.description ?? "",
          date: typed.date ?? "",
          image: resolveMediaURL(typed.image),
          location: typed.location ?? "",
          attendanceEnabled: Boolean(typed.attendanceEnabled),
          grantsMembership: Boolean(typed.grantsMembership),
        };
      });
  }
  catch{
    return null;
  }
}