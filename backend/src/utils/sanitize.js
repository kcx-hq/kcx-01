export function toText(value) {
  if (value === undefined || value === null || value === "") return null;
  return String(value).trim();
}

export function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}

export function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function clean(v) {
  if (!v) return null;
  const t = String(v).trim();
  return t === "" || t === "N/A" ? null : t;
}

export function safeParseJSON(str) {
  if (!str || str.toLowerCase() === "null") return {}; // treat empty/null as empty object
  try {
    return JSON.parse(str);
  } catch (e) {
    return {}; // fallback to empty object if parsing fails
  }
}


export function mapRow(rawRow, mapping) {

  
  const normalizedSource = {};
  const result = {};

  /* ==========================
     1️⃣ Normalize CSV headers
  ========================== */
  for (const key in rawRow) {
    normalizedSource[key.trim().toLowerCase()] = rawRow[key];
  }

  /* ==========================
     2️⃣ Map internal fields
  ========================== */
  for (const internalField in mapping) {
    const sourceCol = mapping[internalField];

    if (!sourceCol) {
      result[internalField] = null;
      continue;
    }

    const normalizedSourceCol = sourceCol.trim().toLowerCase();

    result[internalField] =
      normalizedSource[normalizedSourceCol] ?? null;
  }

  return result;
}




export function normalizeHeader(h) {
  return h
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_");
}


