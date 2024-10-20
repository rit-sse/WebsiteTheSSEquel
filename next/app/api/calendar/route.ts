import { NextRequest } from "next/server";
import { getToken } from "../../../lib/calendar";

/**
 * HTTP GET to /api/calendar
 *
 * List all of the events in the calendar
 *
 * @param request
 * @returns
 */
export async function GET(request: NextRequest) {
  const gcal_token = await getToken();
  // TODO: Where do we get this?
  const calendar_id = 0;

  // TODO: Where does the token go?
  return await fetch(
    `https://calendar.google.com/calendars/${calendar_id}/events`
  );
}

/**
 * HTTP POST to /api/calendar
 *
 * Creates a new event
 *
 * @param request
 * @returns
 */
export async function POST(request: NextRequest) {
  const gcal_token = await getToken();
  // TODO: Where do we get this?
  const calendar_id = 0;

  // TODO: Where does the token go?
  // TODO: Request Body
  return await fetch(
    `https://calendar.google.com/calendars/${calendar_id}/events`,
    { method: "POST" }
  );
}

/**
 * HTTP PUT to /api/calendar
 *
 * Edits an event
 *
 * @param request
 * @returns
 */
export async function PUT(request: NextRequest) {
  const gcal_token = await getToken();
  // TODO: Where do we get this?
  const calendar_id = 0;

  // TODO: Where does the token go?
  // TODO: Request Body
  return await fetch(
    `https://calendar.google.com/calendars/${calendar_id}/events`,
    { method: "PUT" }
  );
}

/**
 * HTTP DELETE to /api/calendar
 *
 * Deletes an event
 *
 * @param request
 * @returns
 */
export async function DELETE(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // verify the id is included
  if (!("id" in body)) {
    return new Response("ID must be included", { status: 422 });
  }
  const id = body.id;

  const gcal_token = await getToken();
  // TODO: Where do we get this?
  const calendar_id = 0;

  // TODO: Where does the token go?
  return await fetch(
    `https://calendar.google.com/calendars/${calendar_id}/events/${id}`,
    { method: "DELETE" }
  );
}
