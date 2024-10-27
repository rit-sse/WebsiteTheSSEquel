import { NextRequest } from "next/server";
import { getToken } from "../../../../lib/calendar";

/**
 * HTTP GET to /api/calendar/[event_id]
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
  // TODO: Where do we get this?
  const calendar_id = 0;

  return await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendar_id}/events/${id}`,
    { headers: { Authorization: `Bearer ${gcal_token}` } }
  );
}
