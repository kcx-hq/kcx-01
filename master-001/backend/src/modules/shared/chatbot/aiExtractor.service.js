// src/services/aiExtractor.service.js
// AI extractor service for normalizing user input per FLOW step.
// Guardrails:
// - Uses GROQ_API_KEY from env. If missing or the call fails, returns null so caller can fallback.
// - Returns strict JSON: { value, needs_clarification, clarifying_question }
// - DOES NOT control flow. It only extracts/normalizes the user's input for the current step.

import fetch from "node-fetch";

const MODEL = "llama-3.1-8b-instant";
const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function stripCodeFences(text = "") {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function buildMessages({ step, userMessage, currentRequirements }) {
  const system = `
You are a requirements extraction assistant.
Extract ONLY what the user explicitly states. Do NOT infer, assume, or invent.
If the input is unclear, request clarification.
Return ONLY valid JSON (no markdown, no explanations).
JSON schema:
{
  "value": string | string[] | null,
  "needs_clarification": boolean,
  "clarifying_question": string | null
}
Rules:
- If step.type === "list" then value must be an array of strings (or null).
- Otherwise value must be a string (or null).
- If vague/empty/irrelevant: value=null, needs_clarification=true, clarifying_question=short question.
- If extraction succeeds: needs_clarification=false, clarifying_question=null.
`.trim();

  const user = `
Step id: ${step?.id}
Step type: ${step?.type}
Field: ${String(step?.field || "")}
Current requirements (JSON): ${JSON.stringify(currentRequirements || {})}
User message: ${String(userMessage || "")}
`.trim();

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function sanitizeExtraction(parsed, step) {
  if (!parsed || typeof parsed !== "object") return null;

  const out = {
    value: null,
    needs_clarification: Boolean(parsed.needs_clarification),
    clarifying_question: parsed.clarifying_question ?? null,
  };

  const val = parsed.value;

  if (step?.type === "list") {
    if (Array.isArray(val)) {
      const arr = val
        .map((v) => String(v ?? "").trim())
        .filter(Boolean);
      out.value = arr.length ? arr : null;
    } else if (typeof val === "string") {
      const arr = val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      out.value = arr.length ? arr : null;
    } else {
      out.value = null;
    }
  } else {
    if (val == null) out.value = null;
    else if (Array.isArray(val)) out.value = val.map((v) => String(v)).join(", ").trim() || null;
    else out.value = String(val).trim() || null;
  }

  // If no usable value, force clarification
  if (!out.value) {
    out.needs_clarification = true;
    if (!out.clarifying_question) {
      out.clarifying_question = "Could you please clarify your previous answer?";
    }
  }

  // If clarification is not needed, ensure clarifying_question is null
  if (!out.needs_clarification) out.clarifying_question = null;

  // Hard cap clarifying question length (keeps UX clean)
  if (out.clarifying_question && out.clarifying_question.length > 200) {
    out.clarifying_question = out.clarifying_question.slice(0, 200);
  }

  return out;
}

/**
 * Extract structured value for current step using Groq.
 * Returns null if AI is not configured or fails, so caller can fallback to non-AI behavior.
 */
export async function extractForStep({ step, userMessage, currentRequirements }) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const messages = buildMessages({ step, userMessage, currentRequirements });

  // 1) Prefer official Groq SDK if available
  try {
    const mod = await import("groq-sdk").catch(() => null);
    if (mod?.default) {
      const Groq = mod.default;
      const client = new Groq({ apiKey: key });

      const resp = await client.chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0,
      });

      const raw = resp?.choices?.[0]?.message?.content ?? "";
      const cleaned = stripCodeFences(raw);
      const parsed = safeParseJson(cleaned);
      const sanitized = sanitizeExtraction(parsed, step);
      return sanitized || null;
    }
  } catch (err) {
    console.error("Groq SDK call failed, falling back to fetch:", err?.message || err);
  }

  // 2) Fallback: fetch OpenAI-compatible chat completions endpoint
  try {
    const resp = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0,
      }),
    });

    const json = await resp.json().catch(() => null);
    const raw = json?.choices?.[0]?.message?.content ?? "";
    const cleaned = stripCodeFences(raw);
    const parsed = safeParseJson(cleaned);
    const sanitized = sanitizeExtraction(parsed, step);
    return sanitized || null;
  } catch (err) {
    console.error("Groq fetch call failed:", err?.message || err);
    return null;
  }
}

export default { extractForStep };
