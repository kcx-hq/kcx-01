import AppError from "../../../errors/AppError.js";
import { ChatMessage, ChatSession } from "../../../models/index.js";
import chatService from "./chat.service.js";

export async function createSessionForClient(clientId) {
  if (!clientId) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid request");
  }

  return ChatSession.create({
    client_id: clientId,
    step_index: 0,
    status: "active",
    requirements: {},
  });
}

export async function getSessionForClient({ sessionId, clientId }) {
  if (!sessionId || !clientId) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid request");
  }

  const session = await ChatSession.findByPk(sessionId);
  if (!session) {
    throw new AppError(404, "NOT_FOUND", "Not found");
  }

  if (String(session.client_id || "") !== String(clientId)) {
    throw new AppError(
      403,
      "UNAUTHORIZED",
      "You do not have permission to perform this action",
    );
  }

  return session;
}

export async function handleClientHelp({ sessionId, clientId }) {
  const session = await getSessionForClient({ sessionId, clientId });
  return chatService.handleHelp(sessionId, session);
}

export async function handleClientBack({ sessionId, clientId }) {
  const session = await getSessionForClient({ sessionId, clientId });
  return chatService.handleBack(sessionId, session);
}

export async function handleClientMessage({ sessionId, clientId, message }) {
  const session = await getSessionForClient({ sessionId, clientId });
  return chatService.handleMessage(sessionId, session, message);
}

export async function handleClientConfirm({ sessionId, clientId }) {
  const session = await getSessionForClient({ sessionId, clientId });
  return chatService.handleConfirm(sessionId, session);
}

export async function getSessionMessages(sessionId) {
  return ChatMessage.findAll({
    where: { session_id: sessionId },
    order: [["created_at", "ASC"]],
  });
}
