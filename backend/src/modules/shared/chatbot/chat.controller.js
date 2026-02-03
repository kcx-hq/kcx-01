// src/controllers/chat.controller.js
import chatService from "./chat.service.js";
import { buildSessionResponse, getCurrentStep } from "./flowHelpers.js";
import { FLOW } from "./flow.js";

const chatController = {
  async createSession(req, res, next) {
    try {
      const session = await chatService.createSession();
      const first = FLOW[0];

      res.json({
        sessionId: session.id,
        question: first.question,
        stepId: first.id,
        stepIndex: 0,
        isDone: false,
        progress: { current: 1, total: FLOW.length },
      });
    } catch (err) {
      console.error("Error creating session:", err);
      next({ status: 500, message: "Failed to create session" });
    }
  },

  async getSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const session = await chatService.getSession(sessionId);
      if (!session) return next({ status: 404, message: "Session not found" });

      res.json(buildSessionResponse(session));
    } catch (err) {
      console.error("Error fetching session:", err);
      next({ status: 500, message: "Failed to fetch session" });
    }
  },

  async postMessage(req, res, next) {
    try {
      const { sessionId, message } = req.body || {};
      if (!sessionId || typeof message !== "string") {
        return next({ status: 400, message: "Missing sessionId or message" });
      }

      const session = await chatService.getSession(sessionId);
      if (!session) return next({ status: 404, message: "Session not found" });

      const raw = message.trim();
      const cmd = raw.toLowerCase();

      if (cmd === "help") return res.json(await chatService.handleHelp(sessionId, session));
      if (cmd === "back") return res.json(await chatService.handleBack(sessionId, session));
      if (cmd === "skip") return res.json(await chatService.handleSkip(sessionId, session));
      if (cmd === "summary") return res.json(await chatService.handleSummary(sessionId, session));
      if (cmd === "restart") return res.json(await chatService.handleRestart(sessionId));

      // ✅ confirm should finalize ONLY at done step
      if (cmd === "confirm") {
        const current = getCurrentStep(session.step_index);
        if (current?.id === "done" || current?.type === "done") {
          return res.json(await chatService.handleConfirm(sessionId, session));
        }
        // otherwise treat confirm as a normal message
        return res.json(await chatService.handleMessage(sessionId, session, raw));
      }

      return res.json(await chatService.handleMessage(sessionId, session, raw));
    } catch (err) {
      console.error("Error processing message:", err);
      next({ status: 500, message: "Failed to process message" });
    }
  },
};

export default chatController;
