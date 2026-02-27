function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeTimezone(value) {
  return String(value || "").trim();
}

function normalizeDateTime(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return String(value || "").trim();
}

export function buildPendingInquiryKey(input = {}) {
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPreferredDateTime = normalizeDateTime(input.preferred_datetime);
  const normalizedTimezone = normalizeTimezone(input.timezone);

  return `${normalizedEmail}::${normalizedPreferredDateTime}::${normalizedTimezone}`;
}

