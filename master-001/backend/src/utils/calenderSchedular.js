import { calendar, calendarId } from "../config/calender.config.js";
import { createZoomMeeting } from "./zoomMeeting.js";
import { DateTime } from "luxon";


import { toZonedTime } from "date-fns-tz";

const BUSINESS_TZ = "Asia/Kolkata"; // Company timezone

export async function scheduleEvent(
  summary,
  description,
  utcDateTime,
  timezone,
  durationMinutes = 60
) {
  try {
    // ✅ Convert UTC → business timezone
    const startLocal = toZonedTime(
      new Date(utcDateTime),
      BUSINESS_TZ
    );

    const endLocal = new Date(
      startLocal.getTime() + durationMinutes * 60000
    );

    // Free/busy check
    const freeBusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: startLocal.toISOString(),
        timeMax: endLocal.toISOString(),
        timeZone: BUSINESS_TZ,
        items: [{ id: calendarId }],
      },
    });

    const calendarData = freeBusyResponse.data.calendars?.[calendarId];

    if (!calendarData) {
      return { success: false, message: "Calendar not accessible" };
    }

    if ((calendarData.busy || []).length > 0) {
      return { success: false, message: "Preferred slot is busy" };
    }

    const zoomLink = await createZoomMeeting(
      summary,
      startLocal.toISOString(),
      durationMinutes
    );

    const event = {
      summary,
      description: `${description}\n\nZoom: ${zoomLink}`,
      location: zoomLink,
      start: {
        dateTime: startLocal.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: endLocal.toISOString(),
        timeZone: timezone,
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      resource: event,
    });

    return {
      success: true,
      meetingLink: zoomLink,
      event: response.data,
    };
  } catch (error) {
    console.error("Schedule error:", error);
    return { success: false, message: error.message };
  }
}




export async function getFreeSlots(
  fromUTC,
  toUTC,
  slotMinutes = 60
) {
  // 1️⃣ FreeBusy query — UTC ONLY
  const fb = await calendar.freebusy.query({
    requestBody: {
      timeMin: fromUTC,
      timeMax: toUTC,
      timeZone: "UTC",
      items: [{ id: calendarId }],
    },
  });

  const busy = fb.data.calendars?.[calendarId]?.busy || [];
  const freeSlots = [];

  let current = DateTime.fromISO(fromUTC, { zone: "utc" });
  const end = DateTime.fromISO(toUTC, { zone: "utc" });

  while (current.plus({ minutes: slotMinutes }) <= end) {
    const slotStart = current;
    const slotEnd = slotStart.plus({ minutes: slotMinutes });

    const isBusy = busy.some(b =>
      DateTime.fromISO(b.start) < slotEnd &&
      DateTime.fromISO(b.end) > slotStart
    );

    if (!isBusy) {
      freeSlots.push({
        start: slotStart.toISO(),
        end: slotEnd.toISO(),
      });
    }

    current = slotEnd;
  }

  return freeSlots;
}
