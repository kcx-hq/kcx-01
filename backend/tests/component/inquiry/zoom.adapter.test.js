import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosPostMock = vi.fn();

vi.mock("axios", () => ({
  default: {
    post: axiosPostMock,
  },
}));

describe("inquiry component - zoom adapters", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    process.env.ZOOM_ACCOUNT_ID = "acct-123";
    process.env.ZOOM_CLIENT_ID = "client-abc";
    process.env.ZOOM_CLIENT_SECRET = "secret-xyz";
  });

  it("requests zoom oauth token with account credentials grant", async () => {
    axiosPostMock.mockResolvedValueOnce({ data: { access_token: "token-1" } });

    const { getZoomAccessToken } = await import("../../../src/config/zoom.config.js");
    const token = await getZoomAccessToken();

    expect(token).toBe("token-1");
    expect(axiosPostMock).toHaveBeenCalledTimes(1);

    const [url, payload, options] = axiosPostMock.mock.calls[0];
    expect(url).toBe(
      "https://zoom.us/oauth/token?grant_type=account_credentials&account_id=acct-123",
    );
    expect(payload).toEqual({});
    expect(options.headers.Authorization).toBe(
      `Basic ${Buffer.from("client-abc:secret-xyz").toString("base64")}`,
    );
  });

  it("creates zoom meeting with bearer token and expected payload", async () => {
    const tokenMock = vi.fn().mockResolvedValue("zoom-access-2");
    vi.doMock("../../../src/config/zoom.config.js", () => ({
      getZoomAccessToken: tokenMock,
    }));

    const { createZoomMeeting } = await import("../../../src/utils/zoomMeeting.js");

    axiosPostMock.mockResolvedValueOnce({
      data: { join_url: "https://zoom.us/j/meeting-123" },
    });

    const joinUrl = await createZoomMeeting("Kickoff", "2026-06-01T10:00:00.000Z", 45, "UTC");

    expect(joinUrl).toBe("https://zoom.us/j/meeting-123");
    expect(tokenMock).toHaveBeenCalledTimes(1);
    expect(axiosPostMock).toHaveBeenCalledTimes(1);
    expect(axiosPostMock).toHaveBeenCalledWith(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: "Kickoff",
        type: 2,
        start_time: "2026-06-01T10:00:00.000Z",
        duration: 45,
        timezone: "UTC",
        settings: {
          join_before_host: false,
          waiting_room: true,
        },
      },
      {
        headers: {
          Authorization: "Bearer zoom-access-2",
          "Content-Type": "application/json",
        },
      },
    );
  });
});
