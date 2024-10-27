import jwt from "jsonwebtoken";
import fs from "fs";

let accessToken = new Promise<string>((resolve, reject) => {
  resolve("");
});
let expiry = 0;

export const getToken = async () => {
  if (expiry > Math.floor(Date.now() / 1000) + 3300) {
    return await accessToken;
  }

  accessToken = new Promise<string>(async (resolve, reject) => {
    const token = jwt.sign(
      {
        iss: process.env.GCAL_CLIENT_EMAIL,
        scope:
          "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
        aud: "https://oauth2.googleapis.com/token",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.GCAL_PRIVATE_KEY,
      {
        algorithm: "RS256",
      }
    );

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: token,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = (await res.json()) as any;
    accessToken = data.access_token;
    expiry = Math.floor(Date.now() / 1000) + data.expires_in;
    resolve(accessToken);
  });

  // set the expiry so that anyone else calling this function awaits our promise
  expiry = Math.floor(Date.now() / 1000) + 3600;
  return await accessToken;
};

// const fetchCalendar = async () => {
//   // mintime is the current time in RFC3339 format
//   const mintime = new Date().toISOString();

//   const calendarRes = await fetch(
//     "https://www.googleapis.com/calendar/v3/calendars/????/events?timeMin=" +
//       mintime,
//     {
//       method: "GET",
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//       },
//     }
//   );

//   const calendarData = (await calendarRes.json()) as any;
//   console.log(calendarData);
// };
