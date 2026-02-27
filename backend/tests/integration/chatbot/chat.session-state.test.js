import { beforeEach, describe, expect, it } from "vitest";
import { ChatSession } from "../../../src/models/index.js";
import chatService from "../../../src/modules/shared/chatbot/chat.service.js";
import {
  createChatSessionFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

describe("chatbot session state integration", () => {
  beforeEach(() => {
    resetFactoryState();
    process.env.GROQ_API_KEY = "";
  });

  it("rejects invalid abandoned -> completed transition and keeps session unchanged", async () => {
    const session = await createChatSessionFixture({
      status: "abandoned",
      step_index: 2,
      requirements: { project: { service: "Optimization" } },
    });

    await expect(
      chatService.handleConfirm(session.id, session),
    ).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT",
    });

    const reloaded = await ChatSession.findByPk(session.id);
    expect(reloaded.status).toBe("abandoned");
    expect(reloaded.step_index).toBe(2);
  });

  it("allows completed session restart and resets workflow state", async () => {
    const session = await createChatSessionFixture({
      status: "completed",
      step_index: 5,
      requirements: { project: { service: "Cost reduction" } },
    });

    const restarted = await chatService.handleRestart(session.id);

    expect(restarted.stepIndex).toBe(0);
    expect(restarted.isDone).toBe(false);

    const reloaded = await ChatSession.findByPk(session.id);
    expect(reloaded.status).toBe("active");
    expect(reloaded.step_index).toBe(0);
    expect(reloaded.requirements).toEqual({});
  });
});
