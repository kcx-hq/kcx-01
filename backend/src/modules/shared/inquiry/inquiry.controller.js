import {
  sendInquiryAcknowledgementEmail,
  sendInquiryEmailToCompany,
  sendMeetingConfirmationEmail,
  sendInquiryRejectionEmail,
} from "../../../utils/sendEmail.js";
import { generateJWT, verifyJWT } from "../../../utils/jwt.js";
import { Inquiry } from "../../../models/index.js";
import { createInquiry } from "./inquiry.service.js";
import { scheduleEvent, getFreeSlots } from "../../../utils/calenderSchedular.js";
import { DateTime } from "luxon";
import { toZonedTime } from "date-fns-tz";
import { fromZonedTime } from "date-fns-tz";
const BUSINESS_TZ = "Asia/Kolkata"; // Company timezone

export const submitInquiry = async (req, res) => {
  try {
    const { name, email, message, preferred_datetime, timezone } = req.body;

    if (!preferred_datetime || !timezone) {
      return res.status(400).json({
        message: "Preferred date, time, and timezone are required",
      });
    }

    // ✅ Convert client local time → UTC
    const utcPreferredDateTime = fromZonedTime(preferred_datetime, timezone);

    const newInquiry = await createInquiry({
      name,
      email,
      message,
      preferred_datetime: utcPreferredDateTime,
      timezone,
    });

    const actionToken = generateJWT({ inquiryId: newInquiry.id });
    await newInquiry.update({ action_token: actionToken });

    const acceptLink = `${process.env.BACKEND_URL}/api/inquiry/accept/${newInquiry.id}?token=${actionToken}`;
    const rejectLink = `${process.env.BACKEND_URL}/api/inquiry/reject/${newInquiry.id}?token=${actionToken}`;

    const businessPreferredDateTime = toZonedTime(
      new Date(utcPreferredDateTime),
      BUSINESS_TZ
    );

    await sendInquiryEmailToCompany(
      name,
      email,
      message,
      businessPreferredDateTime,
      BUSINESS_TZ,
      acceptLink,
      rejectLink
    );

    await sendInquiryAcknowledgementEmail(
      email,
      name,
      preferred_datetime,
      timezone
    );

    return res.status(201).json({
      message: "Inquiry submitted successfully",
      data: newInquiry,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const acceptInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) return res.status(400).send("Invalid request");

    const inquiry = await Inquiry.findByPk(id);
    if (!inquiry) return res.status(404).send("Inquiry not found");

    if (inquiry.status !== "PENDING") {
      return res.send("This inquiry has already been processed.");
    }

    if (token !== inquiry.action_token) {
      return res.status(403).send("Invalid or expired link.");
    }

    verifyJWT(token);

    // ✅ preferred_datetime is UTC from DB
    const event = await scheduleEvent(
      `Meeting with ${inquiry.name}`,
      inquiry.message,
      inquiry.preferred_datetime,
      inquiry.timezone
    );

    if (!event.success) {
      return res.status(500).send(event.message);
    }

    await inquiry.update({
      status: "ACCEPTED",
      meet_link: event.meetingLink,
      action_token: null,
    });

    await sendMeetingConfirmationEmail(
      inquiry.email,
      inquiry.name,
      inquiry.preferred_datetime,
      inquiry.timezone,
      event.meetingLink
    );

    return res.send(
       `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Inquiry Status</title>
        <style>
          body { font-family: Arial; background:#f8f9fa; display:flex; justify-content:center; align-items:center; height:100vh; }
          .card { background:#fff; padding:40px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.1); text-align:center; }
          .success { color:#28a745; font-size:3rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="success">✅</div>
          <h1>Inquiry Accepted</h1>
          <p>The meeting has been scheduled and the client has been notified.</p>
        </div>
      </body>
      </html>`
    );
  } catch (error) {
    console.error(error);
    return res.status(500).send("Something went wrong");
  }
};

export const rejectInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Invalid request");
    }

    // 1️⃣ Find inquiry
    const inquiry = await Inquiry.findByPk(id);

    if (!inquiry) {
      return res.status(404).send("Inquiry not found");
    }

    // 2️⃣ Already processed
    if (inquiry.status !== "PENDING") {
      return res.send("This inquiry has already been processed.");
    }

    // 3️⃣ Validate token
    if (token !== inquiry.action_token) {
      return res.status(403).send("Invalid or expired link.");
    }

    // 4️⃣ Verify JWT expiry
    verifyJWT(token);

    // 5️⃣ Update inquiry
    await inquiry.update({
      status: "REJECTED",
      action_token: null, // invalidate token
    });

    // 6️⃣ Notify client
    await sendInquiryRejectionEmail(inquiry.email, inquiry.name);

    // 7️⃣ Response
    return res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Inquiry Status</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f8f9fa;
        color: #333;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .card {
        background: #fff;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        text-align: center;
      }
      .failure {
        color: #dc3545;
        font-size: 3rem;
        margin-bottom: 20px;
      }
      h1 {
        margin-bottom: 15px;
      }
      p {
        font-size: 1.1rem;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="failure">❌</div>
      <h1>Inquiry Rejected</h1>
      <p>You have rejected the client's inquiry.</p>
    </div>
  </body>
  </html>
`);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Something went wrong");
  }
};

/**
 * GET /api/slots/by-date
 * Query:
 *  - date (YYYY-MM-DD) [required]
 *  - slotMinutes (default 60)
 */
export async function getSlotsByDate(req, res) {
  try {
    const { date, userTimezone } = req.query;
    const slotMinutes = Number(req.query.slotMinutes) || 60;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "date query param is required (YYYY-MM-DD)",
      });
    }

    // 1️⃣ Build business-day window IN BUSINESS TZ
    let start = DateTime.fromISO(date, { zone: BUSINESS_TZ }).set({
      hour: 10,
      minute: 0,
    });

    let end = DateTime.fromISO(date, { zone: BUSINESS_TZ }).set({
      hour: 18,
      minute: 0,
    });

    // 2️⃣ If today → start from now (BUSINESS TZ)
    const now = DateTime.now().setZone(BUSINESS_TZ);
    if (start.hasSame(now, "day") && now > start) {
      const rounded = now.plus({
        minutes: 30 - (now.minute % 30),
      });
      start = rounded < end ? rounded : end;
    }

    if (start >= end) {
      return res.json({
        success: true,
        date,
        businessTimezone: BUSINESS_TZ,
        slots: [],
      });
    }

    // 3️⃣ Convert ONCE to UTC
    const fromUTC = start.toUTC().toISO();
    const toUTC = end.toUTC().toISO();

    // 4️⃣ Get free slots (UTC)
    const freeSlots = await getFreeSlots(fromUTC, toUTC, slotMinutes);

    // 5️⃣ Convert slots to USER timezone for response
    const viewerTZ = userTimezone || BUSINESS_TZ;

    const slots = freeSlots.map((slot) => ({
      start: DateTime.fromISO(slot.start)
        .setZone(viewerTZ)
        .toFormat("yyyy-MM-dd HH:mm"),
      end: DateTime.fromISO(slot.end)
        .setZone(viewerTZ)
        .toFormat("yyyy-MM-dd HH:mm"),
    }));

    return res.json({
      success: true,
      date,
      businessTimezone: BUSINESS_TZ,
      userTimezone: viewerTZ,
      slots,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
