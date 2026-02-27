import { DateTime } from "luxon";
import AppError from "../../../errors/AppError.js";

export const DEFAULT_BUSINESS_TIMEZONE = "Asia/Kolkata";

export function hasRequiredInquirySubmitFields(payload) {
  return Boolean(payload?.preferred_datetime && payload?.timezone);
}

export function buildInquiryActionLinks({ backendUrl, inquiryId, actionToken }) {
  const baseUrl = String(backendUrl || "").replace(/\/$/, "");
  const id = encodeURIComponent(String(inquiryId || ""));
  const token = encodeURIComponent(String(actionToken || ""));

  return {
    acceptLink: `${baseUrl}/api/inquiry/accept/${id}?token=${token}`,
    rejectLink: `${baseUrl}/api/inquiry/reject/${id}?token=${token}`,
  };
}

export function validateInquiryActionState({ token, inquiry }) {
  if (!token) {
    return new AppError(400, "VALIDATION_ERROR", "Invalid request");
  }

  if (!inquiry) {
    return new AppError(404, "NOT_FOUND", "Not found");
  }

  if (inquiry.status !== "PENDING") {
    return new AppError(409, "CONFLICT", "Conflict");
  }

  if (token !== inquiry.action_token) {
    return new AppError(
      403,
      "UNAUTHORIZED",
      "You do not have permission to perform this action",
    );
  }

  return null;
}

export function buildBusinessDayWindow({
  date,
  businessTimezone = DEFAULT_BUSINESS_TIMEZONE,
  now = DateTime.now().setZone(businessTimezone),
}) {
  let start = DateTime.fromISO(date, { zone: businessTimezone }).set({
    hour: 10,
    minute: 0,
  });

  const end = DateTime.fromISO(date, { zone: businessTimezone }).set({
    hour: 18,
    minute: 0,
  });

  if (start.hasSame(now, "day") && now > start) {
    const rounded = now.plus({
      minutes: 30 - (now.minute % 30),
    });
    start = rounded < end ? rounded : end;
  }

  return { start, end };
}

export function toUtcIsoRange({ start, end }) {
  return {
    fromUTC: start.toUTC().toISO(),
    toUTC: end.toUTC().toISO(),
  };
}

export function resolveViewerTimezone(userTimezone, businessTimezone) {
  return userTimezone || businessTimezone;
}

export function formatSlotsForViewer(freeSlots, viewerTimezone) {
  return freeSlots.map((slot) => ({
    start: DateTime.fromISO(slot.start)
      .setZone(viewerTimezone)
      .toFormat("yyyy-MM-dd HH:mm"),
    end: DateTime.fromISO(slot.end)
      .setZone(viewerTimezone)
      .toFormat("yyyy-MM-dd HH:mm"),
  }));
}
