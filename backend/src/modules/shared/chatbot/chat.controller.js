// src/controllers/chat.controller.js
import chatService from "./chat.service.js";
import { buildSessionResponse, getCurrentStep } from "./flowHelpers.js";
import { FLOW } from "./flow.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";
import {
  createSessionForClient,
  getSessionForClient,
} from "./chat.integration.service.js";

const chatController = {
  async createSession(req, res, next) {
    try {
      const session = await createSessionForClient(req.client_id);
      const first = FLOW[0];

      return res.ok({
        sessionId: session.id,
        question: first.question,
        stepId: first.id,
        stepIndex: 0,
        isDone: false,
        progress: { current: 1, total: FLOW.length },
      });
    } catch (err) {
      logger.error({ err, requestId: req.requestId }, "Error creating session");
      if (err instanceof AppError) {
        return next(err);
      }
      return next(new AppError(500, "INTERNAL", "Internal server error", { cause: err }));
    }
  },

  async getSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const session = await getSessionForClient({
        sessionId,
        clientId: req.client_id,
      });

      return res.ok(buildSessionResponse(session));
    } catch (err) {
      logger.error({ err, requestId: req.requestId }, "Error fetching session");
      if (err instanceof AppError) {
        return next(err);
      }
      return next(new AppError(500, "INTERNAL", "Internal server error", { cause: err }));
    }
  },

  async postMessage(req, res, next) {
    try {
      const { sessionId, message } = req.body || {};
      if (!sessionId || typeof message !== "string") {
        return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
      }

      const session = await getSessionForClient({
        sessionId,
        clientId: req.client_id,
      });

      const raw = message.trim();
      const cmd = raw.toLowerCase();

      if (cmd === "help") return res.ok(await chatService.handleHelp(sessionId, session));
      if (cmd === "back") return res.ok(await chatService.handleBack(sessionId, session));
      if (cmd === "skip") return res.ok(await chatService.handleSkip(sessionId, session));
      if (cmd === "summary") return res.ok(await chatService.handleSummary(sessionId, session));
      if (cmd === "restart") return res.ok(await chatService.handleRestart(sessionId));

      // ✅ confirm should finalize ONLY at done step
      if (cmd === "confirm") {
        const current = getCurrentStep(session.step_index);
        if (current?.id === "done" || current?.type === "done") {
          return res.ok(await chatService.handleConfirm(sessionId, session));
        }
        // otherwise treat confirm as a normal message
        return res.ok(await chatService.handleMessage(sessionId, session, raw));
      }

      return res.ok(await chatService.handleMessage(sessionId, session, raw));
    } catch (err) {
      logger.error({ err, requestId: req.requestId }, "Error processing message");
      if (err instanceof AppError) {
        return next(err);
      }
      return next(new AppError(500, "INTERNAL", "Internal server error", { cause: err }));
    }
  },
};

export default chatController;
