import { NextRequest } from "next/server";
import { getToken } from "@/lib/calendar";

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

  return await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${
      process.env.GCAL_CAL_ID || "primary"
    }/events`,
    {
      headers: { Authorization: `Bearer ${gcal_token}` },
    }
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
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  if (
    !(
      "summary" in body &&
      "description" in body &&
      "location" in body &&
      "start" in body &&
      "end" in body
    )
  ) {
    return new Response("Summary, Description, Location, Start, and End must be included", { status: 422 });
  }

  const gcal_token = await getToken();

  const gcalResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${
      process.env.GCAL_CAL_ID || "primary"
    }/events`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${gcal_token}` },
      body: JSON.stringify({
        summary: body.summary,
        description: body.description,
        location: body.location,
        start: {
          dateTime: body.start,
          timeZone: "America/New_York", 
        },
        end: {
          dateTime: body.end,
          timeZone: "America/New_York",
        },
      }),
    }
  );

  return new Response(await gcalResponse.text(), {
    status: gcalResponse.status,
    headers: {
      "Content-Type": gcalResponse.headers.get("Content-Type") || "application/json",
    },
  });
}

/**
 * HTTP PUT to /api/calendar
 *
 * Edits an event
 *
 * Internally, this is mapped go gcal's PATCH method because it supports partial changes
 *
 * @param request
 * @returns
 */
export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  // Verify that all required fields are included
  if (
    !(
      "id" in body &&
      "summary" in body &&
      "description" in body &&
      "location" in body &&
      "start" in body &&
      "end" in body
    )
  ) {
    return new Response("ID must be included", { status: 422 });
  }

  const gcal_token = await getToken();

  const gcalResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${
      process.env.GCAL_CAL_ID || "primary"
    }/events/${body.id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${gcal_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: body.summary,
        description: body.description,
        location: body.location,
        start: {
          dateTime: body.start,
          timeZone: "America/New_York",
        },
        end: {
          dateTime: body.end,
          timeZone: "America/New_York",
        },
      }),
    }
  );

  return new Response(await gcalResponse.text(), {
    status: gcalResponse.status,
    headers: {
      "Content-Type": gcalResponse.headers.get("Content-Type") || "application/json",
    },
  });
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

  const gcalResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${
      process.env.GCAL_CAL_ID || "primary"
    }/events/${id}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${gcal_token}` } }
  );

  const responseText = gcalResponse.status === 204 ? null : await gcalResponse.text();

  return new Response(responseText ?? undefined, {
    status: gcalResponse.status,
    headers: {
      "Content-Type": gcalResponse.headers.get("Content-Type") || "application/json",
    },
  });
}
