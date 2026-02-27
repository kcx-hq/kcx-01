import { beforeEach, describe, expect, it, vi } from "vitest";

const { mgCreateMock } = vi.hoisted(() => ({
  mgCreateMock: vi.fn(),
}));

vi.mock("../../../src/config/mailgun.config.js", () => ({
  mg: {
    messages: {
      create: mgCreateMock,
    },
  },
}));

vi.mock("../../../src/lib/logger.js", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { sendEmail, sendVerificationEmail } from "../../../src/utils/sendEmail.js";

describe("auth component - mailgun adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MAILGUN_FROM = "noreply@kandco.test";
    process.env.MAILGUN_DOMAIN = "sandbox.kandco.test";
  });

  it("builds and sends mailgun payload with expected fields", async () => {
    mgCreateMock.mockResolvedValueOnce({ id: "msg-1" });

    const result = await sendEmail({
      to: "user@example.test",
      subject: "Reset Password",
      html: "<p>Reset</p>",
    });

    expect(result).toEqual({ id: "msg-1" });
    expect(mgCreateMock).toHaveBeenCalledTimes(1);
    expect(mgCreateMock).toHaveBeenCalledWith("sandbox.kandco.test", {
      from: "KandCo <noreply@kandco.test>",
      to: "user@example.test",
      subject: "Reset Password",
      html: "<p>Reset</p>",
    });
  });

  it("rethrows provider errors from sendEmail", async () => {
    const providerError = new Error("mailgun unavailable");
    mgCreateMock.mockRejectedValueOnce(providerError);

    await expect(
      sendEmail({
        to: "user@example.test",
        subject: "Verify",
        html: "<p>OTP</p>",
      }),
    ).rejects.toThrow("mailgun unavailable");
  });

  it("sends verification email with expected subject and dynamic content", async () => {
    mgCreateMock.mockResolvedValueOnce({ id: "msg-verify" });

    const result = await sendVerificationEmail("jane@example.test", "Jane", "654321");

    expect(result).toEqual({ success: true });
    expect(mgCreateMock).toHaveBeenCalledTimes(1);

    const [, payload] = mgCreateMock.mock.calls[0];
    expect(payload.to).toBe("jane@example.test");
    expect(payload.subject).toBe("Verify your email");
    expect(payload.html).toContain("Jane");
    expect(payload.html).toContain("654321");
  });

  it("maps verification provider failures to stable response contract", async () => {
    mgCreateMock.mockRejectedValueOnce(new Error("provider timeout"));

    const result = await sendVerificationEmail("john@example.test", "John", "111222");

    expect(result).toEqual({
      success: false,
      message: "Failed to send email",
    });
  });
});
