import { google } from 'googleapis';

// Sign into Google client
const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// For now, production would get and use their own refresh token
// Add https://developers.google.com/oauthplayground to Authorized redirect URIs in Google Cloud Client
// https://developers.google.com/oauthplayground/
// Top right settings -> Use your own OAuth credentials -> Enter client ID & Secret -> Select scopes -> Authorize APIs -> Exchange Authorization Code for tokens - > Copy and store refresh token from console
// Scopes: https://www.googleapis.com/auth/calendar, https://www.googleapis.com/auth/calendar.events

// GoogleCalendarAPI Client
auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const calendar = google.calendar({ version: 'v3', auth });

/**
 * HTTP GET request to api/event/calendar/
 * @returns List of all Google Calendar events
 */
export async function GET(){
    const response = await calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID
    })
    
    return new Response(JSON.stringify({ data: response.data }), { status: 200 })
}

/**
 * HTTP POST request to api/event/calendar/
 * @param request - { id: int, title: string, location: string, description: string, start: ISOString }
 * @returns 200 status code if successful
 */
export async function POST(request: Request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return new Response("Invalid JSON", { status: 422 });
    }
    if (!("title" in body && "description" in body && "date" in body)) {
        return new Response(JSON.stringify({message: "Title, description, and date must be included", event: body}), { status: 422 });
    }

    const { id, title, location, description, date } = body;

    const event = {
        id,
        summary: title,
        location, 
        description,
        start: { dateTime: new Date(date).toISOString(), timeZone: 'America/New_York' },
        end: { dateTime: new Date(new Date(date).getTime() + 60 * 60 * 1000).toISOString(), timeZone: 'America/New_York' },
    };

    try {
        const response = await calendar.events.insert({
            auth: auth,
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            requestBody: event,
        })

        return new Response('Event added to Google Calendar', { status: 200 });

    } catch (e: any) {
        return new Response(JSON.stringify({ message: 'Failed to add event to Google Calendar', error: e.message }), { status: 500 });
    }
}

/**
 * HTTP PUT request to api/event/calendar/
 * @param request - { id: int, title: string, location: string, description: string, start: ISOString }
 * @returns 200 status code if successful
 */
export async function PUT(request: Request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return new Response("Invalid JSON", { status: 422 });
    };
    if (!("id" in body && "title" in body && "description" in body && "date" in body)) {
        return new Response(JSON.stringify({ message: "ID, title, description, and date must be included", event: body }), { status: 422 });
    }

    const { id, title, location, description, date } = body;

    const event = {
        id,
        summary: title,
        location, 
        description,
        start: { dateTime: new Date(date).toISOString(), timeZone: 'America/New_York' },
        end: { dateTime: new Date(new Date(date).getTime() + 60 * 60 * 1000).toISOString(), timeZone: 'America/New_York' },
    };

    try {
        const response = await calendar.events.update({
            auth: auth,
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            eventId: id,
            requestBody: event,
        })

        return new Response('Event updated in Google Calendar', { status: 200 });

    } catch (e: any) {
        return new Response(JSON.stringify({ message: 'Failed to update event in Google Calendar', error: e.message }), { status: 500 });
    }
}

/**
 * HTTP DELETE request to api/event/calendar/
 * @param request - { id: int }
 * @returns 200 status code if successful
 */
export async function DELETE(request: Request){
    let body;
    try {
        body = await request.json();
    } catch {
        return new Response("Invalid JSON", { status: 422 });
    }
    if (!("id" in body)) {
        return new Response("ID must be included", { status: 422 });
    }

    const { id } = body;

    try {
        const response = await calendar.events.delete({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            eventId: id,
        })

        return new Response('Event deleted from Google Calendar', { status: 200 });

    } catch (e:any) {
        return new Response(JSON.stringify({ message: 'Failed to delete event from Google Calendar', error: e.message }), { status: 500 });
    }
}
