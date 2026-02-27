import { beforeEach, describe, expect, it } from "vitest";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import { createAuthIdentity } from "../../helpers/authFixtures.js";
import { resetFactoryState } from "../../helpers/factories.js";

const emailModuleMock = {
  path: "../../src/utils/sendEmail.js",
  factory: () => ({
    sendInquiryAcknowledgementEmail: async () => {},
    sendInquiryEmailToCompany: async () => {},
    sendMeetingConfirmationEmail: async () => {},
    sendInquiryRejectionEmail: async () => {},
    sendVerificationEmail: async () => {},
    sendEmail: async () => {},
  }),
};

describe("inquiry create api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("creates inquiry successfully with authenticated caller", async () => {
    const client = await createApiClient({ mocks: [emailModuleMock] });
    const identity = await createAuthIdentity({
      user: { email: "inquiry.create@example.test" },
    });

    const response = await client.post("/api/inquiry/submit", {
      headers: identity.authHeaders,
      body: {
        name: "Acme Team",
        email: "contact@acme.test",
        message: "Need onboarding support",
        preferred_datetime: "2026-05-10T10:00:00",
        timezone: "UTC",
      },
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        message: "Inquiry submitted successfully",
        data: expect.objectContaining({
          id: expect.any(String),
          email: "contact@acme.test",
          status: "PENDING",
        }),
      }),
    );
  });

  it("returns 400 contract for invalid payload", async () => {
    const client = await createApiClient({ mocks: [emailModuleMock] });
    const identity = await createAuthIdentity({
      user: { email: "inquiry.invalid@example.test" },
    });

    const response = await client.post("/api/inquiry/submit", {
      headers: identity.authHeaders,
      body: {
        name: "Acme Team",
        email: "not-an-email",
        message: "Missing fields should fail",
      },
    });

    assertErrorContract(response, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request",
    });
  });
});
