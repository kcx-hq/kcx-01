import { beforeEach, describe, expect, it } from "vitest";
import { ChatSession } from "../../../src/models/index.js";
import {
  createSessionForClient,
  getSessionForClient,
  getSessionMessages,
  handleClientBack,
  handleClientConfirm,
  handleClientHelp,
  handleClientMessage,
} from "../../../src/modules/shared/chatbot/chat.integration.service.js";
import chatService from "../../../src/modules/shared/chatbot/chat.service.js";
import {
  createChatSessionFixture,
  createClientFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

describe("chatbot integration service", () => {
  beforeEach(() => {
    resetFactoryState();
    process.env.GROQ_API_KEY = "";
  });

  it("creates an active chat session with default workflow state", async () => {
    const session = await chatService.createSession();

    expect(session.status).toBe("active");
    expect(session.step_index).toBe(0);
    expect(session.requirements).toEqual({});
  });

  it("creates client-owned sessions", async () => {
    const client = await createClientFixture();
    const session = await createSessionForClient(client.id);

    expect(session.client_id).toBe(client.id);
    expect(session.status).toBe("active");
  });

  it("loads session when client ownership matches", async () => {
    const client = await createClientFixture();
    const session = await createSessionForClient(client.id);

    const loaded = await getSessionForClient({
      sessionId: session.id,
      clientId: client.id,
    });

    expect(loaded.id).toBe(session.id);
  });

  it("blocks cross-client session access", async () => {
    const owner = await createClientFixture();
    const stranger = await createClientFixture();
    const session = await createSessionForClient(owner.id);

    await expect(
      getSessionForClient({
        sessionId: session.id,
        clientId: stranger.id,
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "UNAUTHORIZED",
    });

    await expect(ChatSession.count()).resolves.toBe(1);
  });

  it("writes help command messages to chat log", async () => {
    const client = await createClientFixture();
    const session = await createSessionForClient(client.id);

    const result = await handleClientHelp({
      sessionId: session.id,
      clientId: client.id,
    });

    const messages = await getSessionMessages(session.id);
    expect(result.stepIndex).toBe(0);
    expect(messages).toHaveLength(2);
    expect(messages[0].sender).toBe("user");
    expect(messages[0].message).toBe("help");
    expect(messages[1].sender).toBe("bot");
  });

  it("handles invalid blank messages without mutating session step", async () => {
    const client = await createClientFixture();
    const session = await createSessionForClient(client.id);

    const result = await handleClientMessage({
      sessionId: session.id,
      clientId: client.id,
      message: "   ",
    });

    const reloaded = await ChatSession.findByPk(session.id);
    const messages = await getSessionMessages(session.id);

    expect(result.reply).toBe("Please provide an answer.");
    expect(result.stepIndex).toBe(0);
    expect(reloaded.step_index).toBe(0);
    expect(messages).toHaveLength(2);
    expect(messages[0].message).toBe("");
    expect(messages[1].message).toBe("Please provide an answer.");
  });

  it("moves back command safely at step zero and logs command messages", async () => {
    const client = await createClientFixture();
    const session = await createSessionForClient(client.id);

    const result = await handleClientBack({
      sessionId: session.id,
      clientId: client.id,
    });

    const reloaded = await ChatSession.findByPk(session.id);
    const messages = await getSessionMessages(session.id);

    expect(result.stepIndex).toBe(0);
    expect(reloaded.step_index).toBe(0);
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[0].message).toBe("back");
  });

  it("marks session completed on confirm command", async () => {
    const client = await createClientFixture();
    const session = await createChatSessionFixture({
      client_id: client.id,
      status: "active",
      step_index: 3,
      requirements: { project: { service: "Cost optimization" } },
    });

    const result = await handleClientConfirm({
      sessionId: session.id,
      clientId: client.id,
    });

    const reloaded = await ChatSession.findByPk(session.id);
    const messages = await getSessionMessages(session.id);

    expect(result.isDone).toBe(true);
    expect(reloaded.status).toBe("completed");
    expect(messages[messages.length - 1].sender).toBe("bot");
  });
});
