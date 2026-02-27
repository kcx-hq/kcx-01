import { describe, expect, it } from "vitest";
import {
  formatConfirmValue,
  looksLikeProjectContent,
  validateChatInput,
  validateStrict,
} from "../../../src/modules/shared/chatbot/chat.rules.js";

describe("chat.rules", () => {
  describe("formatConfirmValue", () => {
    it.each([
      [["aws", "gcp"], "aws, gcp"],
      ["single", "single"],
      [null, ""],
      [42, "42"],
    ])("formats %p -> %p", (input, expected) => {
      expect(formatConfirmValue(input)).toBe(expected);
    });
  });

  describe("looksLikeProjectContent", () => {
    it.each([
      ["Need aws billing dashboard", true],
      ["alerts for cost spikes", true],
      ["random hello there", false],
      ["", false],
    ])("classifies project content: %p", (input, expected) => {
      expect(looksLikeProjectContent(input)).toBe(expected);
    });
  });

  describe("validateStrict", () => {
    it("accepts yes_no values for yes/no", () => {
      expect(
        validateStrict({ validationPolicy: { kind: "yes_no" } }, "yes"),
      ).toEqual({ ok: true });
      expect(
        validateStrict({ validationPolicy: { kind: "yes_no" } }, "no"),
      ).toEqual({ ok: true });
    });

    it("rejects invalid yes_no value", () => {
      expect(
        validateStrict({ validationPolicy: { kind: "yes_no" } }, "maybe"),
      ).toEqual({ ok: false, msg: "Please type 'yes' or 'no'." });
    });

    it("validates email policy", () => {
      expect(
        validateStrict({ validationPolicy: { kind: "email" } }, "person@acme.com"),
      ).toEqual({ ok: true });
      expect(
        validateStrict({ validationPolicy: { kind: "email" } }, "person-at-acme"),
      ).toEqual({ ok: false, msg: "Please enter a valid email address." });
    });

    it("validates budget_or_not_sure policy", () => {
      expect(
        validateStrict({ validationPolicy: { kind: "budget_or_not_sure" } }, "10k"),
      ).toEqual({ ok: true });
      expect(
        validateStrict({ validationPolicy: { kind: "budget_or_not_sure" } }, "not sure"),
      ).toEqual({ ok: true });
      expect(
        validateStrict({ validationPolicy: { kind: "budget_or_not_sure" } }, "unspecified"),
      ).toEqual({
        ok: false,
        msg: "Please share a budget range (e.g., 5-15L) or type 'not sure'.",
      });
    });
  });

  describe("validateChatInput", () => {
    it("rejects empty user input", () => {
      expect(validateChatInput("   ", { mode: "strict", type: "text" })).toEqual({
        valid: false,
        error: "Please provide an answer.",
      });
    });

    it("applies strict policy when mode is strict", () => {
      expect(
        validateChatInput("maybe", {
          mode: "strict",
          type: "text",
          validationPolicy: { kind: "yes_no" },
        }),
      ).toEqual({
        valid: false,
        error: "Please type 'yes' or 'no'.",
      });
    });

    it("validates list tokens", () => {
      expect(validateChatInput("aws, gcp", { type: "list" })).toEqual({ valid: true });
      expect(validateChatInput("   ,   ", { type: "list" })).toEqual({
        valid: false,
        error: "Please provide at least one item.",
      });
    });
  });
});
