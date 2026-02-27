import { describe, expect, it } from "vitest";
import {
  assertChatSessionTransition,
  buildChatMessageCommandKey,
  getChatSessionTransitionResult,
} from "../../../src/modules/shared/chatbot/lib/sessionStatus.utils.js";

describe("chat session transition rules", () => {
  it.each([
    ["active", "completed", true, "CHAT_SESSION_ALLOWED"],
    ["completed", "active", true, "CHAT_SESSION_ALLOWED"],
    ["abandoned", "completed", false, "CHAT_SESSION_CONFLICT"],
    ["completed", "abandoned", false, "CHAT_SESSION_CONFLICT"],
    ["unknown", "active", false, "CHAT_SESSION_INVALID"],
  ])(
    "evaluates transition %s -> %s",
    (fromStatus, toStatus, allowed, code) => {
      const result = getChatSessionTransitionResult(fromStatus, toStatus);
      expect(result.allowed).toBe(allowed);
      expect(result.code).toBe(code);
    },
  );

  it("throws conflict on disallowed transition", () => {
    try {
      assertChatSessionTransition("completed", "abandoned");
      throw new Error("expected transition to throw");
    } catch (error) {
      expect(error.status).toBe(409);
      expect(error.code).toBe("CONFLICT");
      expect(error.safeMessage).toBe("Conflict");
    }
  });
});

describe("chat command idempotency key", () => {
  it("returns same key for equivalent command payload", () => {
    const first = buildChatMessageCommandKey({
      sessionId: "session-1",
      messageId: "m-100",
      message: " HELP ",
    });
    const second = buildChatMessageCommandKey({
      sessionId: "session-1 ",
      messageId: "m-100",
      message: "help",
    });

    expect(first).toBe("session-1::m-100::help");
    expect(second).toBe(first);
  });

  it("returns different key when message id differs", () => {
    const first = buildChatMessageCommandKey({
      sessionId: "session-1",
      messageId: "m-100",
      message: "help",
    });
    const second = buildChatMessageCommandKey({
      sessionId: "session-1",
      messageId: "m-101",
      message: "help",
    });

    expect(first).not.toBe(second);
  });
});
