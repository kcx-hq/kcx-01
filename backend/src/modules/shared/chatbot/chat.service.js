// src/services/chat.service.js
import sequelize from "../../../config/db.config.js";
import { ChatSession, ChatMessage } from "../../../models/index.js";
import { FLOW } from "./flow.js";
import { setDeep } from "./deepSet.js";
import { formatSummary, getCurrentStep } from "./flowHelpers.js";
import aiExtractor from "./aiExtractor.service.js";
import { assertChatSessionTransition } from "./lib/sessionStatus.utils.js";

/** Always write bot messages via this helper */
async function sendBot(sessionId, message, transaction) {
  if (message === null || typeof message === "undefined") return;
  await ChatMessage.create(
    { session_id: sessionId, sender: "bot", message },
    transaction ? { transaction } : {},
  );
}

/** Always write user messages via this helper */
async function sendUser(sessionId, message, transaction) {
  if (message === null || typeof message === "undefined") return;
  await ChatMessage.create(
    { session_id: sessionId, sender: "user", message },
    transaction ? { transaction } : {},
  );
}

async function getLastBotMessage(sessionId) {
  const last = await ChatMessage.findOne({
    where: { session_id: sessionId, sender: "bot" },
    order: [["created_at", "DESC"]],
  });
  return last?.message || null;
}

function pickAck(step) {
  const acks = step?.acknowledgements || [];
  if (!acks.length) return "Got it.";
  return acks[Math.floor(Math.random() * acks.length)];
}

function formatConfirmValue(v) {
  if (Array.isArray(v)) return v.join(", ");
  return String(v ?? "");
}

function looksLikeProjectContent(text) {
  const t = (text || "").toLowerCase();
  return (
    t.includes("dashboard") ||
    t.includes("app") ||
    t.includes("website") ||
    t.includes("automation") ||
    t.includes("aws") ||
    t.includes("billing") ||
    t.includes("alerts") ||
    t.includes("reports") ||
    t.includes("feature")
  );
}

function validateStrict(step, trimmed) {
  const kind = step?.validationPolicy?.kind;

  if (kind === "identity") {
    return { ok: true };
  }

  if (kind === "timeline") {
    return { ok: true };
  }

  if (kind === "budget_or_not_sure") {
    const ok =
      trimmed.toLowerCase() === "not sure" ||
      trimmed.match(/<|>|l|lak|lakh|k|usd|inr|₹|\$|\d/i);
    if (!ok) {
      return {
        ok: false,
        msg: "Please share a budget range (e.g., 5–15L) or type 'not sure'.",
      };
    }
    return { ok: true };
  }

  // ✅ NEW: yes/no validation
  if (kind === "yes_no") {
    const t = trimmed.toLowerCase();
    const ok = t === "yes" || t === "no";
    if (!ok) return { ok: false, msg: "Please type 'yes' or 'no'." };
    return { ok: true };
  }

  // ✅ NEW: email validation
  if (kind === "email") {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!ok) return { ok: false, msg: "Please enter a valid email address." };
    return { ok: true };
  }

  return { ok: true };
}

const chatService = {
  async createSession() {
    return await ChatSession.create({
      step_index: 0,
      status: "active",
      requirements: {},
    });
  },

  async getSession(sessionId) {
    return await ChatSession.findByPk(sessionId);
  },

  validateInput(message, step) {
    const trimmed = (message || "").trim();
    if (!trimmed) return { valid: false, error: "Please provide an answer." };

    if (step?.mode === "strict") {
      const r = validateStrict(step, trimmed);
      if (!r.ok) return { valid: false, error: r.msg };
    }

    if (step.type === "list") {
      const tokens = trimmed
        .split(/,|\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (!tokens.length)
        return { valid: false, error: "Please provide at least one item." };
    }

    return { valid: true };
  },

  async handleHelp(sessionId, session) {
    const current = getCurrentStep(session.step_index);
    await sendUser(sessionId, "help");
    const reply = `Here’s an example: ${current?.help || "No specific help available."}`;
    await sendBot(sessionId, reply);
    return {
      sessionId: session.id,
      reply,
      question: null,
      stepId: current?.id || null,
      stepIndex: session.step_index,
      isDone: false,
      progress: { current: session.step_index + 1, total: FLOW.length },
    };
  },

  async handleBack(sessionId, session) {
    const tx = await sequelize.transaction();
    try {
      const prevIndex = Math.max(session.step_index - 1, 0);
      const prevStep = FLOW[prevIndex];

      await session.update({ step_index: prevIndex }, { transaction: tx });

      await sendUser(sessionId, "back", tx);
      await sendBot(sessionId, "Sure — let’s go back one step.", tx);

      const lastBot = await getLastBotMessage(sessionId);
      if (lastBot !== prevStep.question)
        await sendBot(sessionId, prevStep.question, tx);

      await tx.commit();

      return {
        sessionId: session.id,
        reply: "Sure — let’s go back one step.",
        question: prevStep.question,
        stepId: prevStep.id,
        stepIndex: prevIndex,
        isDone: false,
        progress: { current: prevIndex + 1, total: FLOW.length },
      };
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  },

  async handleSkip(sessionId, session) {
    const tx = await sequelize.transaction();
    try {
      const current = getCurrentStep(session.step_index);
      await sendUser(sessionId, "skip", tx);

      const requirements = JSON.parse(
        JSON.stringify(session.requirements || {}),
      );
      if (current?.field) setDeep(requirements, current.field, null);

      const nextIndex = Math.min(session.step_index + 1, FLOW.length - 1);
      const nextStep = FLOW[nextIndex];

      await session.update(
        {
          step_index: nextIndex,
          requirements,
          status: nextStep.type === "done" ? "completed" : session.status,
        },
        { transaction: tx },
      );

      await sendBot(sessionId, "No problem — we’ll skip that for now.", tx);

      const lastBot = await getLastBotMessage(sessionId);
      if (lastBot !== nextStep.question)
        await sendBot(sessionId, nextStep.question, tx);

      await tx.commit();

      return {
        sessionId: session.id,
        reply: "No problem — we’ll skip that for now.",
        question: nextStep.question,
        stepId: nextStep.id,
        stepIndex: nextIndex,
        isDone: nextStep.type === "done",
        progress: { current: nextIndex + 1, total: FLOW.length },
      };
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  },

  // ✅ UPDATED: summary shows recap AND asks schedule_meeting question
  async handleSummary(sessionId, session) {
    await sendUser(sessionId, "summary");
    await sendBot(sessionId, "Here’s what I’ve captured so far:");

    const scheduleIndex = FLOW.findIndex((s) => s.id === "schedule_meeting");
    const scheduleStep = FLOW[scheduleIndex];

    if (scheduleIndex !== -1 && scheduleStep?.question) {
      await session.update({ step_index: scheduleIndex });
      await sendBot(sessionId, scheduleStep.question);
    }

    return {
      sessionId: session.id,
      reply: "Here’s what I’ve captured so far:",
      summary: formatSummary(session.requirements),
      rawRequirements: session.requirements,
      question:  null,
      stepId:  null,
      stepIndex: scheduleIndex !== -1 ? scheduleIndex : session.step_index,
      isDone: false,
      progress: {
        current:
          (scheduleIndex !== -1 ? scheduleIndex : session.step_index) + 1,
        total: FLOW.length,
      },
    };
  },

  // Still used only at DONE step (controller will enforce)
  async handleConfirm(sessionId, session) {
    const tx = await sequelize.transaction();
    try {
      assertChatSessionTransition(session.status, "completed");
      await sendUser(sessionId, "confirm", tx);
      await session.update({ status: "completed" }, { transaction: tx });

      const reply =
        "Perfect — submitted ✅. We’ll review and get back to you soon.";
      await sendBot(sessionId, reply, tx);

      await tx.commit();

      return {
        sessionId: session.id,
        reply,
        question: null,
        stepId: "confirmed",
        stepIndex: session.step_index,
        isDone: true,
        progress: { current: session.step_index + 1, total: FLOW.length },
      };
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  },

  async handleRestart(sessionId) {
    const tx = await sequelize.transaction();
    try {
      const session = await ChatSession.findByPk(sessionId, {
        transaction: tx,
      });
      if (!session) throw new Error("Session not found");
      assertChatSessionTransition(session.status, "active");

      await session.update(
        { step_index: 0, requirements: {}, status: "active" },
        { transaction: tx },
      );

      await sendUser(sessionId, "restart", tx);
      await sendBot(sessionId, "Restarted — let’s start fresh.", tx);

      const first = FLOW[0];
      await sendBot(sessionId, first.question, tx);

      await tx.commit();

      return {
        sessionId: session.id,
        reply: "Restarted — let’s start fresh.",
        question: first.question,
        stepId: first.id,
        stepIndex: 0,
        isDone: false,
        progress: { current: 1, total: FLOW.length },
      };
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  },

  /** MAIN: state machine */
  async handleMessage(sessionId, session, message) {
    const current = getCurrentStep(session.step_index);
    const trimmed = (message || "").trim();

    if (!current) {
      await sendUser(sessionId, trimmed);
      return {
        sessionId: session.id,
        reply:
          "This session is already complete. Type 'restart' to start again.",
        question: null,
        stepId: "done",
        stepIndex: session.step_index,
        isDone: session.status === "completed",
        progress: { current: session.step_index + 1, total: FLOW.length },
      };
    }

    const validation = this.validateInput(trimmed, current);
    if (!validation.valid) {
      await sendUser(sessionId, trimmed);
      await sendBot(sessionId, validation.error);
      return {
        sessionId: session.id,
        reply: validation.error,
        question: null,
        stepId: current.id,
        stepIndex: session.step_index,
        isDone: false,
        progress: { current: session.step_index + 1, total: FLOW.length },
      };
    }

    const tx = await sequelize.transaction();
    try {
      await sendUser(sessionId, trimmed, tx);

      const requirements = JSON.parse(
        JSON.stringify(session.requirements || {}),
      );

      const isAiStep = current.mode === "ai_assist";
      let extractorResult = null;

      if (isAiStep) {
        extractorResult = await aiExtractor
          .extractForStep({
            step: current,
            userMessage: trimmed,
            currentRequirements: requirements,
          })
          .catch(() => null);
      }

      if (extractorResult && extractorResult.needs_clarification) {
        await sendBot(sessionId, extractorResult.clarifying_question, tx);
        await tx.commit();
        return {
          sessionId: session.id,
          reply: extractorResult.clarifying_question,
          question: null,
          stepId: current.id,
          stepIndex: session.step_index,
          isDone: false,
          progress: { current: session.step_index + 1, total: FLOW.length },
        };
      }

      // Save
      let savedValue = null;
      if (current.field) {
        const useAI = extractorResult && extractorResult.value != null;

        if (current.type === "list") {
          const value = useAI
            ? extractorResult.value
            : trimmed
                .split(/,|\s+/)
                .map((s) => s.trim())
                .filter(Boolean);
          savedValue = value;
          setDeep(requirements, current.field, value);
        } else {
          const value = useAI ? extractorResult.value : trimmed;
          savedValue = value;
          setDeep(requirements, current.field, value);
        }
      }

      // ✅ Branching next step
      let nextIndex = Math.min(session.step_index + 1, FLOW.length - 1);
      let meeting = null ;

      // If schedule_meeting answered "no" → jump to done
      if (current.id === "schedule_meeting") {
        const want = (savedValue || "").toString().trim().toLowerCase();
        if (want === "no") {
          const doneIndex = FLOW.findIndex((s) => s.id === "done");
          if (doneIndex !== -1) nextIndex = doneIndex;
        }
      }
      

      const nextStep = FLOW[nextIndex];
      const newStatus = nextStep.type === "done" ? "completed" : session.status;

      await session.update(
        { step_index: nextIndex, requirements, status: newStatus },
        { transaction: tx },
      );

      // Reply
      const ack = pickAck(current);
      const confirm =
        current.confirmationTemplate && savedValue != null
          ? current.confirmationTemplate.replace(
              "{value}",
              formatConfirmValue(savedValue),
            )
          : null;
      const reply = confirm ? `${ack} ${confirm}` : ack;

      await sendBot(sessionId, reply, tx);

      // Ask next question ONCE
      const lastBot = await getLastBotMessage(sessionId);
      if (nextStep?.question && lastBot !== nextStep.question) {
        await sendBot(sessionId, nextStep.question, tx);
      }

      await tx.commit();

      if (current.id === "meeting_message") {
         meeting = {
          name:requirements?.client?.identity,
          email: requirements?.meeting?.email,
          message: requirements?.meeting?.message,
        };
      }

      return {
        sessionId: session.id,
        reply,
        question: nextStep?.question || null,
        stepId: nextStep?.id || null,
        stepIndex: nextIndex,
        isDone: newStatus === "completed",
        progress: { current: nextIndex + 1, total: FLOW.length },
        meeting
      };
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  },
};

export default chatService;
