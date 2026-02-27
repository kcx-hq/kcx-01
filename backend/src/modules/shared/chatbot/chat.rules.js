export function formatConfirmValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value ?? "");
}

export function looksLikeProjectContent(text) {
  const normalized = String(text || "").toLowerCase();
  return (
    normalized.includes("dashboard") ||
    normalized.includes("app") ||
    normalized.includes("website") ||
    normalized.includes("automation") ||
    normalized.includes("aws") ||
    normalized.includes("billing") ||
    normalized.includes("alerts") ||
    normalized.includes("reports") ||
    normalized.includes("feature")
  );
}

export function validateStrict(step, trimmedInput) {
  const kind = step?.validationPolicy?.kind;
  const trimmed = String(trimmedInput || "");

  if (kind === "identity" || kind === "timeline") {
    return { ok: true };
  }

  if (kind === "budget_or_not_sure") {
    const ok =
      trimmed.toLowerCase() === "not sure" ||
      /<|>|l|lak|lakh|k|usd|inr|₹|\$|\d/i.test(trimmed);
    if (!ok) {
      return {
        ok: false,
        msg: "Please share a budget range (e.g., 5-15L) or type 'not sure'.",
      };
    }
    return { ok: true };
  }

  if (kind === "yes_no") {
    const value = trimmed.toLowerCase();
    if (value !== "yes" && value !== "no") {
      return { ok: false, msg: "Please type 'yes' or 'no'." };
    }
    return { ok: true };
  }

  if (kind === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { ok: false, msg: "Please enter a valid email address." };
    }
    return { ok: true };
  }

  return { ok: true };
}

export function validateChatInput(message, step) {
  const trimmed = String(message || "").trim();
  if (!trimmed) {
    return { valid: false, error: "Please provide an answer." };
  }

  if (step?.mode === "strict") {
    const strictValidation = validateStrict(step, trimmed);
    if (!strictValidation.ok) {
      return { valid: false, error: strictValidation.msg };
    }
  }

  if (step?.type === "list") {
    const tokens = trimmed
      .split(/,|\s+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      return { valid: false, error: "Please provide at least one item." };
    }
  }

  return { valid: true };
}
