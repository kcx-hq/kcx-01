import { describe, expect, it } from "vitest";
import { setDeep } from "../../../src/modules/shared/chatbot/deepSet.js";

describe("chatbot deepSet", () => {
  it("sets nested values using dot path", () => {
    const target = {};
    setDeep(target, "meeting.email", "user@example.com");

    expect(target).toEqual({
      meeting: {
        email: "user@example.com",
      },
    });
  });

  it("overwrites existing nested value", () => {
    const target = { meeting: { email: "old@example.com" } };
    setDeep(target, "meeting.email", "new@example.com");

    expect(target.meeting.email).toBe("new@example.com");
  });

  it("creates intermediate objects when path collides with non-object", () => {
    const target = { meeting: "invalid" };
    setDeep(target, "meeting.email", "user@example.com");

    expect(target).toEqual({
      meeting: {
        email: "user@example.com",
      },
    });
  });

  it("supports deep multi-level writes", () => {
    const target = {};
    setDeep(target, "a.b.c.d", 5);

    expect(target.a.b.c.d).toBe(5);
  });
});
