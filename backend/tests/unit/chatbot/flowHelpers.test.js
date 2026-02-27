import { describe, expect, it } from "vitest";
import {
  buildSessionResponse,
  formatSummary,
  getCurrentStep,
} from "../../../src/modules/shared/chatbot/flowHelpers.js";
import { FLOW } from "../../../src/modules/shared/chatbot/flow.js";

describe("chatbot flowHelpers", () => {
  it("returns step by index for valid step index", () => {
    expect(getCurrentStep(0)).toBe(FLOW[0]);
    expect(getCurrentStep(3)).toBe(FLOW[3]);
  });

  it("falls back to final step for out-of-range index", () => {
    expect(getCurrentStep(10_000)).toBe(FLOW[FLOW.length - 1]);
  });

  it("formats summary with labels and normalized values", () => {
    const summary = formatSummary({
      client: { identity: " John ", company: "Acme", role: "Engineering" },
      project: { service: "Cost optimization", message: "Need dashboard setup" },
      finops: { provider: "AWS", spend: "$10k-$50k" },
      meeting: { want: "yes", email: "ops@acme.com", message: "Prefer Tuesday" },
    });

    expect(summary).toEqual({
      Name: "John",
      Company: "Acme",
      "Service Needed": "Cost optimization",
      "Cloud Provider": "AWS",
      "Monthly Cloud Spend": "$10k-$50k",
      Role: "Engineering",
      "Message / Need": "Need dashboard setup",
      "Schedule Meeting": "yes",
      "Meeting Email": "ops@acme.com",
      "Meeting Note": "Prefer Tuesday",
    });
  });

  it("keeps all labels with empty string values when data is missing", () => {
    const summary = formatSummary({});
    expect(Object.keys(summary)).toHaveLength(10);
    expect(Object.values(summary).every((value) => value === "")).toBe(true);
  });

  it("builds session response shape and progress metadata", () => {
    const session = {
      id: "session-1",
      step_index: 2,
      status: "active",
    };

    const response = buildSessionResponse(session);

    expect(response).toEqual({
      sessionId: "session-1",
      question: FLOW[2].question,
      stepId: FLOW[2].id,
      stepIndex: 2,
      isDone: false,
      progress: {
        current: 3,
        total: FLOW.length,
      },
    });
  });

  it("marks session as done when status is completed", () => {
    const response = buildSessionResponse({
      id: "session-2",
      step_index: FLOW.length - 1,
      status: "completed",
    });

    expect(response.isDone).toBe(true);
  });
});
