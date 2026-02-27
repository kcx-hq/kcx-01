import { beforeEach, describe, expect, it, vi } from "vitest";

const { freeBusyQueryMock, eventsInsertMock, createZoomMeetingMock } = vi.hoisted(() => ({
  freeBusyQueryMock: vi.fn(),
  eventsInsertMock: vi.fn(),
  createZoomMeetingMock: vi.fn(),
}));

vi.mock("../../../src/config/calender.config.js", () => ({
  calendarId: "calendar-test-id",
  calendar: {
    freebusy: {
      query: freeBusyQueryMock,
    },
    events: {
      insert: eventsInsertMock,
    },
  },
}));

vi.mock("../../../src/utils/zoomMeeting.js", () => ({
  createZoomMeeting: createZoomMeetingMock,
}));

vi.mock("../../../src/lib/logger.js", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { getFreeSlots, scheduleEvent } from "../../../src/utils/calenderSchedular.js";

describe("inquiry component - calendar scheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns busy response without creating zoom meeting", async () => {
    freeBusyQueryMock.mockResolvedValueOnce({
      data: {
        calendars: {
          "calendar-test-id": {
            busy: [{ start: "2026-06-01T10:00:00.000Z", end: "2026-06-01T11:00:00.000Z" }],
          },
        },
      },
    });

    const result = await scheduleEvent(
      "Discovery",
      "Discuss requirements",
      "2026-06-01T10:00:00.000Z",
      "UTC",
      60,
    );

    expect(result).toEqual({ success: false, message: "Preferred slot is busy" });
    expect(createZoomMeetingMock).not.toHaveBeenCalled();
    expect(eventsInsertMock).not.toHaveBeenCalled();
  });

  it("returns calendar inaccessible when freebusy payload has no calendar", async () => {
    freeBusyQueryMock.mockResolvedValueOnce({
      data: {
        calendars: {},
      },
    });

    const result = await scheduleEvent(
      "Discovery",
      "Discuss requirements",
      "2026-06-01T10:00:00.000Z",
      "UTC",
      60,
    );

    expect(result).toEqual({ success: false, message: "Calendar not accessible" });
    expect(createZoomMeetingMock).not.toHaveBeenCalled();
  });

  it("creates zoom meeting and inserts calendar event when slot is free", async () => {
    freeBusyQueryMock.mockResolvedValueOnce({
      data: {
        calendars: {
          "calendar-test-id": {
            busy: [],
          },
        },
      },
    });
    createZoomMeetingMock.mockResolvedValueOnce("https://zoom.us/j/abc123");
    eventsInsertMock.mockResolvedValueOnce({
      data: { id: "event-1" },
    });

    const result = await scheduleEvent(
      "Architecture Review",
      "Walkthrough",
      "2026-06-01T10:00:00.000Z",
      "UTC",
      45,
    );

    expect(result.success).toBe(true);
    expect(result.meetingLink).toBe("https://zoom.us/j/abc123");
    expect(result.event).toEqual({ id: "event-1" });

    expect(freeBusyQueryMock).toHaveBeenCalledTimes(1);
    const freebusyPayload = freeBusyQueryMock.mock.calls[0][0].requestBody;
    expect(freebusyPayload.timeZone).toBe("Asia/Kolkata");
    expect(freebusyPayload.items).toEqual([{ id: "calendar-test-id" }]);

    expect(createZoomMeetingMock).toHaveBeenCalledTimes(1);
    expect(createZoomMeetingMock).toHaveBeenCalledWith(
      "Architecture Review",
      expect.any(String),
      45,
    );

    expect(eventsInsertMock).toHaveBeenCalledTimes(1);
    const insertPayload = eventsInsertMock.mock.calls[0][0];
    expect(insertPayload.calendarId).toBe("calendar-test-id");
    expect(insertPayload.resource.location).toBe("https://zoom.us/j/abc123");
    expect(insertPayload.resource.description).toContain("Zoom: https://zoom.us/j/abc123");
  });

  it("maps scheduling failures to a stable failure response", async () => {
    freeBusyQueryMock.mockResolvedValueOnce({
      data: {
        calendars: {
          "calendar-test-id": {
            busy: [],
          },
        },
      },
    });
    createZoomMeetingMock.mockRejectedValueOnce(new Error("zoom timeout"));

    const result = await scheduleEvent(
      "Architecture Review",
      "Walkthrough",
      "2026-06-01T10:00:00.000Z",
      "UTC",
      45,
    );

    expect(result).toEqual({ success: false, message: "zoom timeout" });
    expect(eventsInsertMock).not.toHaveBeenCalled();
  });

  it("computes free slots in UTC while excluding busy windows", async () => {
    freeBusyQueryMock.mockResolvedValueOnce({
      data: {
        calendars: {
          "calendar-test-id": {
            busy: [
              {
                start: "2026-06-01T10:00:00.000Z",
                end: "2026-06-01T11:00:00.000Z",
              },
            ],
          },
        },
      },
    });

    const slots = await getFreeSlots(
      "2026-06-01T09:00:00.000Z",
      "2026-06-01T12:00:00.000Z",
      60,
    );

    expect(slots).toEqual([
      {
        start: "2026-06-01T09:00:00.000Z",
        end: "2026-06-01T10:00:00.000Z",
      },
      {
        start: "2026-06-01T11:00:00.000Z",
        end: "2026-06-01T12:00:00.000Z",
      },
    ]);
  });
});
