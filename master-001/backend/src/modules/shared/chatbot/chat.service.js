// src/services/chat.service.js
import sequelize from "../../../config/db.config.js";
import { ChatSession, ChatMessage } from "../../../models/index.js";
import { FLOW } from "./flow.js";
import { setDeep } from "./deepSet.js";
import { formatSummary, getCurrentStep } from "./flowHelpers.js";
import aiExtractor from "./aiExtractor.service.js";

/** Always write bot messages via this helper */
async function sendBot(sessionId, message, transaction) {
  if (!message) return;
  await ChatMessage.create(
    { session_id: sessionId, sender: "bot", message },
    transaction ? { transaction } : {},
  );
}

/** Always write user messages via this helper */
async function sendUser(sessionId, message, transaction) {
  if (!message) return;
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
    const hasTwoWords = trimmed.split(/\s+/).filter(Boolean).length >= 2;
    const hasCompanyHint =
      trimmed.includes("(") ||
      trimmed.toLowerCase().includes("corp") ||
      trimmed.toLowerCase().includes("pvt") ||
      trimmed.toLowerCase().includes("ltd") ||
      trimmed.toLowerCase().includes("inc") ||
      trimmed.toLowerCase().includes("company");

    if (looksLikeProjectContent(trimmed)) {
      return {
        ok: false,
        msg: "Quick check — I still need your name and company first.",
      };
    }
    if (!hasTwoWords && !hasCompanyHint) {
      return {
        ok: false,
        msg: "Could you share your name and company? (e.g., Rahul, Acme Corp)",
      };
    }
    return { ok: true };
  }

  if (kind === "timeline") {
    // accept short like "1w", "4 weeks", "March 15"
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
      // allow list without commas IF AI can normalize; if strict fallback, require at least one token
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
      question: null, // ✅ don't repeat step question
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

      // ✅ ask only the step question, but prevent duplicates
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

  async handleSummary(sessionId, session) {
    const current = getCurrentStep(session.step_index);
    await sendUser(sessionId, "summary");
    await sendBot(sessionId, "Here’s what I’ve captured so far:");

    return {
      sessionId: session.id,
      reply: "Here’s what I’ve captured so far:",
      summary: formatSummary(session.requirements),
      rawRequirements: session.requirements,
      question: null, // ✅ DO NOT resend any step question
      stepId: current?.id || null,
      stepIndex: session.step_index,
      isDone: false,
      progress: { current: session.step_index + 1, total: FLOW.length },
    };
  },

  async handleConfirm(sessionId, session) {
    const tx = await sequelize.transaction();
    try {
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

  /** MAIN: single state machine. Always emits ONE next question (or none). */
  async handleMessage(sessionId, session, message) {
    const current = getCurrentStep(session.step_index);
    const trimmed = (message || "").trim();

    if (!current) {
      // no step: don't spam questions
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
      // ask the same question once (UI already shows it; but API can include it)
      return {
        sessionId: session.id,
        reply: validation.error,
        question: null, // ✅ DO NOT re-send current.question (prevents duplicates)
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

      // AI only for ai_assist
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

      // Clarification from AI
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

      const clarifications = requirements._clarifications || {};
      const stepKey = current.id;

      if (current.ambiguityPolicy && extractorResult?.value) {
        const text = extractorResult.value.toLowerCase();
        const words = text.split(/\s+/).filter(Boolean);

        const isTooShort =
          current.ambiguityPolicy.minWords &&
          words.length < current.ambiguityPolicy.minWords;

        const isVagueSingleWord =
          current.ambiguityPolicy.vagueWords?.includes(words[0]) &&
          words.length === 1;

        const clarificationAlreadyAsked = clarifications[stepKey];

        // 🚨 Ask clarification ONLY ONCE
        if ((isTooShort || isVagueSingleWord) && !clarificationAlreadyAsked) {
          // mark clarification asked
          clarifications[stepKey] = true;
          requirements._clarifications = clarifications;

          await session.update({ requirements }, { transaction: tx });

          await sendBot(
            sessionId,
            "Could you clarify a bit more? For example, what exactly needs to be monitored and why?",
            tx,
          );

          await tx.commit();

          return {
            sessionId: session.id,
            reply:
              "Could you clarify a bit more? For example, what exactly needs to be monitored and why?",
            question: null,
            stepId: current.id,
            stepIndex: session.step_index,
            isDone: false,
            progress: {
              current: session.step_index + 1,
              total: FLOW.length,
            },
          };
        }

        // ✅ clarification already asked → ACCEPT answer
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

       if (requirements._clarifications) {
        delete requirements._clarifications[current.id];
      }

      // Advance exactly one step
      const nextIndex = Math.min(session.step_index + 1, FLOW.length - 1);
      const nextStep = FLOW[nextIndex];
      const newStatus = nextStep.type === "done" ? "completed" : session.status;

     

      await session.update(
        { step_index: nextIndex, requirements, status: newStatus },
        { transaction: tx },
      );

      // Human reply
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

      // Ask next question ONCE (avoid duplicates)
      const lastBot = await getLastBotMessage(sessionId);
      if (nextStep?.question && lastBot !== nextStep.question) {
        await sendBot(sessionId, nextStep.question, tx);
      }

      await tx.commit();

      return {
        sessionId: session.id,
        reply,
        question: nextStep?.question || null,
        stepId: nextStep?.id || null,
        stepIndex: nextIndex,
        isDone: newStatus === "completed",
        progress: { current: nextIndex + 1, total: FLOW.length },
      };
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  },
};

export default chatService;
