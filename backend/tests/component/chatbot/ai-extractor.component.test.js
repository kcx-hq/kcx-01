import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMock, groqCreateMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  groqCreateMock: vi.fn(),
}));

vi.mock("node-fetch", () => ({
  default: fetchMock,
}));

vi.mock("groq-sdk", () => ({
  default: class Groq {
    constructor() {
      this.chat = {
        completions: {
          create: groqCreateMock,
        },
      };
    }
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

import { extractForStep } from "../../../src/modules/shared/chatbot/aiExtractor.service.js";

describe("chatbot component - ai extractor adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = "groq-test-key";
  });

  it("returns null without attempting provider calls when api key is missing", async () => {
    delete process.env.GROQ_API_KEY;

    const result = await extractForStep({
      step: { id: "services", type: "list", field: "project.services" },
      userMessage: "EC2, S3",
      currentRequirements: {},
    });

    expect(result).toBeNull();
    expect(groqCreateMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses groq sdk response when available and sanitizes list values", async () => {
    groqCreateMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content:
              "```json\n{\"value\":[\" EC2 \",\"S3\"],\"needs_clarification\":false,\"clarifying_question\":null}\n```",
          },
        },
      ],
    });

    const result = await extractForStep({
      step: { id: "services", type: "list", field: "project.services" },
      userMessage: "EC2 and S3",
      currentRequirements: { project: {} },
    });

    expect(groqCreateMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      value: ["EC2", "S3"],
      needs_clarification: false,
      clarifying_question: null,
    });
  });

  it("falls back to fetch when sdk call fails and sends expected payload", async () => {
    groqCreateMock.mockRejectedValueOnce(new Error("sdk outage"));
    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        choices: [
          {
            message: {
              content:
                '{"value":"timeline in 2 weeks","needs_clarification":false,"clarifying_question":null}',
            },
          },
        ],
      }),
    });

    const result = await extractForStep({
      step: { id: "timeline", type: "text", field: "project.timeline" },
      userMessage: "Two weeks",
      currentRequirements: {},
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer groq-test-key");

    const parsedBody = JSON.parse(options.body);
    expect(parsedBody.model).toBe("llama-3.1-8b-instant");
    expect(parsedBody.temperature).toBe(0);
    expect(parsedBody.messages).toHaveLength(2);

    expect(result).toEqual({
      value: "timeline in 2 weeks",
      needs_clarification: false,
      clarifying_question: null,
    });
  });

  it("forces clarification defaults when extractor yields empty value", async () => {
    groqCreateMock.mockRejectedValueOnce(new Error("sdk outage"));
    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"value":"","needs_clarification":false,"clarifying_question":null}',
            },
          },
        ],
      }),
    });

    const result = await extractForStep({
      step: { id: "budget", type: "text", field: "project.budget" },
      userMessage: "",
      currentRequirements: {},
    });

    expect(result).toEqual({
      value: null,
      needs_clarification: true,
      clarifying_question: "Could you please clarify your previous answer?",
    });
  });

  it("returns null when both sdk and fetch paths fail", async () => {
    groqCreateMock.mockRejectedValueOnce(new Error("sdk down"));
    fetchMock.mockRejectedValueOnce(new Error("fetch down"));

    const result = await extractForStep({
      step: { id: "budget", type: "text", field: "project.budget" },
      userMessage: "Budget 10k",
      currentRequirements: {},
    });

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
