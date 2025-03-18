import { NextRequest } from "next/server";
import { getToken } from "../../../../lib/calendar";

/**
 * HTTP GET to /api/calendar/[id]
 *
 * List all of the events in the calendar
 *
 * @param request
 * @returns
 */
export async function GET(
  request: NextRequest,
  { params: { id } }: { params: { id: string } }
) {
  const gcal_token = await getToken();

  return await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${
      process.env.GCAL_CAL_ID || "primary"
    }/events/${id}`,
    { headers: { Authorization: `Bearer ${gcal_token}` } }
  );
}
