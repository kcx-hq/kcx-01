import { beforeEach, describe, expect, it, vi } from "vitest";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import { createAuthIdentity } from "../../helpers/authFixtures.js";
import {
  createChatSessionFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

describe("chatbot message api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("creates chatbot session successfully for authenticated user", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "chat.session@example.test" },
    });

    const response = await client.post("/api/chatbot/session", {
      headers: identity.authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        sessionId: expect.any(String),
        stepId: "welcome",
        stepIndex: 0,
        isDone: false,
      }),
    );
  });

  it("returns unauthenticated contract when auth is missing", async () => {
    const client = await createApiClient();
    const response = await client.post("/api/chatbot/session");

    assertErrorContract(response, {
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  });

  it("returns payload validation error for malformed message request", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "chat.validation@example.test" },
    });

    const response = await client.post("/api/chatbot/message", {
      headers: identity.authHeaders,
      body: {
        sessionId: "not-a-uuid",
      },
    });

    assertErrorContract(response, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request",
    });
  });

  it("sends command message and receives mapped response", async () => {
    const helpHandler = vi.fn().mockResolvedValue({
      sessionId: "00000000-0000-4000-8000-00000000c0de",
      reply: "Here's help text.",
      question: null,
      stepId: "welcome",
      stepIndex: 0,
      isDone: false,
      progress: { current: 1, total: 10 },
    });

    const client = await createApiClient({
      mocks: [
        {
          path: "../../src/modules/shared/chatbot/chat.service.js",
          factory: () => ({
            default: {
              createSession: vi.fn(),
              getSession: vi.fn().mockResolvedValue({
                id: "00000000-0000-4000-8000-00000000c0de",
                step_index: 0,
                status: "active",
                requirements: {},
              }),
              handleHelp: helpHandler,
              handleBack: vi.fn(),
              handleSkip: vi.fn(),
              handleSummary: vi.fn(),
              handleRestart: vi.fn(),
              handleConfirm: vi.fn(),
              handleMessage: vi.fn(),
            },
          }),
        },
      ],
    });
    const identity = await createAuthIdentity({
      user: { email: "chat.help@example.test" },
    });
    await createChatSessionFixture({
      id: "00000000-0000-4000-8000-00000000c0de",
      client_id: identity.user.client_id,
      step_index: 0,
      status: "active",
      requirements: {},
    });

    const response = await client.post("/api/chatbot/message", {
      headers: identity.authHeaders,
      body: {
        sessionId: "00000000-0000-4000-8000-00000000c0de",
        message: "help",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(helpHandler).toHaveBeenCalledTimes(1);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        sessionId: "00000000-0000-4000-8000-00000000c0de",
        stepId: "welcome",
        isDone: false,
      }),
    );
  });

  it("maps chatbot service failures to standardized api error contract", async () => {
    const messageHandler = vi.fn().mockRejectedValue(new Error("provider timeout"));
    const client = await createApiClient({
      mocks: [
        {
          path: "../../src/modules/shared/chatbot/chat.service.js",
          factory: () => ({
            default: {
              createSession: vi.fn(),
              getSession: vi.fn().mockResolvedValue({
                id: "00000000-0000-4000-8000-00000000beef",
                step_index: 0,
                status: "active",
                requirements: {},
              }),
              handleHelp: vi.fn(),
              handleBack: vi.fn(),
              handleSkip: vi.fn(),
              handleSummary: vi.fn(),
              handleRestart: vi.fn(),
              handleConfirm: vi.fn(),
              handleMessage: messageHandler,
            },
          }),
        },
      ],
    });
    const identity = await createAuthIdentity({
      user: { email: "chat.ai@example.test" },
    });
    await createChatSessionFixture({
      id: "00000000-0000-4000-8000-00000000beef",
      client_id: identity.user.client_id,
      step_index: 0,
      status: "active",
      requirements: {},
    });

    const response = await client.post("/api/chatbot/message", {
      headers: identity.authHeaders,
      body: {
        sessionId: "00000000-0000-4000-8000-00000000beef",
        message: "Need cost optimization dashboard",
      },
    });

    expect(messageHandler).toHaveBeenCalledTimes(1);
    assertErrorContract(response, {
      status: 500,
      code: "INTERNAL",
      message: "Internal server error",
    });
  });
});
