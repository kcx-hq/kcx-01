// calendarConfig.js
import { google } from "googleapis";

// Your Google Calendar ID
const calendarId = process.env.GOOGLE_CALENDAR_ID; // Replace with your shared calendar ID

// Authenticate with service account
const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json", // Make sure this JSON file is in your project root
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

// Create calendar instance
const calendar = google.calendar({ version: "v3", auth });

export { calendar, calendarId };