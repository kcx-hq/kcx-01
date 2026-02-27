import { afterEach, describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { freezeTime, restoreTime } from "../../helpers/time.js";
import {
  buildBusinessDayWindow,
  buildInquiryActionLinks,
  DEFAULT_BUSINESS_TIMEZONE,
  formatSlotsForViewer,
  hasRequiredInquirySubmitFields,
  resolveViewerTimezone,
  toUtcIsoRange,
  validateInquiryActionState,
} from "../../../src/modules/shared/inquiry/inquiry.utils.js";

describe("inquiry.utils", () => {
  afterEach(() => {
    restoreTime();
  });

  describe("submit payload validation", () => {
    it.each([
      [{ preferred_datetime: "2026-03-10T10:00:00", timezone: "Asia/Kolkata" }, true],
      [{ preferred_datetime: "", timezone: "Asia/Kolkata" }, false],
      [{ preferred_datetime: "2026-03-10T10:00:00", timezone: "" }, false],
      [{}, false],
    ])("checks required fields for %p", (payload, expected) => {
      expect(hasRequiredInquirySubmitFields(payload)).toBe(expected);
    });
  });

  it("builds accept/reject links deterministically", () => {
    const links = buildInquiryActionLinks({
      backendUrl: "https://api.example.com/",
      inquiryId: "inq-123",
      actionToken: "abc.def",
    });

    expect(links).toEqual({
      acceptLink: "https://api.example.com/api/inquiry/accept/inq-123?token=abc.def",
      rejectLink: "https://api.example.com/api/inquiry/reject/inq-123?token=abc.def",
    });
  });

  describe("action state validation", () => {
    const pendingInquiry = { status: "PENDING", action_token: "valid-token" };

    it("returns null for valid action state", () => {
      expect(
        validateInquiryActionState({ token: "valid-token", inquiry: pendingInquiry }),
      ).toBeNull();
    });

    it("returns AppError(400) when token is missing", () => {
      const err = validateInquiryActionState({ token: "", inquiry: pendingInquiry });
      expect(err.status).toBe(400);
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.safeMessage).toBe("Invalid request");
    });

    it("returns AppError(404) when inquiry is missing", () => {
      const err = validateInquiryActionState({ token: "x", inquiry: null });
      expect(err.status).toBe(404);
      expect(err.code).toBe("NOT_FOUND");
      expect(err.safeMessage).toBe("Not found");
    });

    it("returns AppError(409) when inquiry is not pending", () => {
      const err = validateInquiryActionState({
        token: "valid-token",
        inquiry: { status: "ACCEPTED", action_token: "valid-token" },
      });
      expect(err.status).toBe(409);
      expect(err.code).toBe("CONFLICT");
      expect(err.safeMessage).toBe("Conflict");
    });

    it("returns AppError(403) when token mismatch occurs", () => {
      const err = validateInquiryActionState({
        token: "wrong-token",
        inquiry: pendingInquiry,
      });
      expect(err.status).toBe(403);
      expect(err.code).toBe("UNAUTHORIZED");
      expect(err.safeMessage).toBe("You do not have permission to perform this action");
    });
  });

  describe("business window rules", () => {
    it("builds default business window (10:00 to 18:00) for non-today date", () => {
      const now = DateTime.fromISO("2026-03-09T12:10:00", {
        zone: DEFAULT_BUSINESS_TIMEZONE,
      });
      const { start, end } = buildBusinessDayWindow({
        date: "2026-03-10",
        now,
      });

      expect(start.toFormat("HH:mm")).toBe("10:00");
      expect(end.toFormat("HH:mm")).toBe("18:00");
    });

    it("rounds start time up to next 30 minutes when date is today", () => {
      freezeTime("2026-03-10T06:40:00.000Z");
      const { start, end } = buildBusinessDayWindow({
        date: "2026-03-10",
        businessTimezone: DEFAULT_BUSINESS_TIMEZONE,
      });

      expect(start.toFormat("HH:mm")).toBe("12:30");
      expect(end.toFormat("HH:mm")).toBe("18:00");
    });

    it("clamps start to end when rounded time exceeds business end", () => {
      freezeTime("2026-03-10T12:20:00.000Z");
      const { start, end } = buildBusinessDayWindow({
        date: "2026-03-10",
        businessTimezone: DEFAULT_BUSINESS_TIMEZONE,
      });

      expect(start.toFormat("HH:mm")).toBe("18:00");
      expect(end.toFormat("HH:mm")).toBe("18:00");
    });
  });

  it("converts business window to UTC ISO range", () => {
    const start = DateTime.fromISO("2026-03-10T10:00:00", {
      zone: DEFAULT_BUSINESS_TIMEZONE,
    });
    const end = DateTime.fromISO("2026-03-10T18:00:00", {
      zone: DEFAULT_BUSINESS_TIMEZONE,
    });

    const range = toUtcIsoRange({ start, end });

    expect(range.fromUTC).toMatch(/^2026-03-10T04:30:00/);
    expect(range.toUTC).toMatch(/^2026-03-10T12:30:00/);
  });

  it("uses user timezone when provided, otherwise falls back to business timezone", () => {
    expect(resolveViewerTimezone("America/New_York", DEFAULT_BUSINESS_TIMEZONE)).toBe(
      "America/New_York",
    );
    expect(resolveViewerTimezone("", DEFAULT_BUSINESS_TIMEZONE)).toBe(
      DEFAULT_BUSINESS_TIMEZONE,
    );
  });

  it("formats free slots in viewer timezone", () => {
    const slots = formatSlotsForViewer(
      [
        {
          start: "2026-03-10T04:30:00.000Z",
          end: "2026-03-10T05:30:00.000Z",
        },
      ],
      "Asia/Kolkata",
    );

    expect(slots).toEqual([
      {
        start: "2026-03-10 10:00",
        end: "2026-03-10 11:00",
      },
    ]);
  });
});
