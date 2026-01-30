import { normalize } from "./normalize.js";
import { aliasScore } from "./aliases.js";
import { detectType, FIELD_TYPES } from "./detectType.js";
import { vocabMatch } from "./vocab.js";
import { cardinality } from "./cardinality.js";
import { canonicalMatch } from "./canonicalMap.js";

// 44- headers outer loop ( csvcolumn)
// internamfields
export function autoSuggest(headers, sampleRows, internalFields) {
  const rowCount = sampleRows.length;

  return headers.map((csvColumn, index) => {
    const values = sampleRows.map((r) => r[csvColumn]);
    const colType = detectType(values);
    const card = cardinality(values);
    const normalizedHeader = normalize(csvColumn);

    // 🔴 1️⃣ CANONICAL OVERRIDE (TOP PRIORITY)
    const canonicalField = canonicalMatch(normalizedHeader);
    if (canonicalField) {
      return {
        csvColumn,
        detectedType: colType,
        suggestions: [
          {
            field: canonicalField,
            score: 1.0,
            reasons: ["canonical-override"],
          },
        ],
        autoMapped: true,
      };
    }

    const hasMeaningfulHeader =
      normalizedHeader.length > 4 && !normalizedHeader.startsWith("col");

    // 🔵 2️⃣ HEURISTIC SUGGESTIONS (existing logic)
    const suggestions = internalFields.map((field) => {
      let score = 0;
      const reasons = [];

      // regionname == regionname
      if (
        normalize(field).includes(normalizedHeader) ||
        normalizedHeader.includes(normalize(field))
      ) {
        score += 0.6;
        reasons.push("header-internal");
      }

      if (normalizedHeader === normalize(field)) {
        score += 0.4;
        reasons.push("exact-header");
      }

      const aliasWeight = aliasScore(csvColumn, field);
      if (aliasWeight) {
        score += aliasWeight * 0.3;
        reasons.push("alias");
      }

      if (FIELD_TYPES[field] === colType) {
        score += 0.2;
        reasons.push("type");
      }

      if (vocabMatch(values, field)) {
        score += 0.1;
        reasons.push("vocab");
      }

      if (
        field.endsWith("id") &&
        card > 0.9 &&
        /(id|account|subscription|project)/i.test(csvColumn)
      ) {
        score += 0.1;
        reasons.push("high-cardinality");
      }

      if (colType === "date" && field.includes("period")) {
        score += 0.15;
        reasons.push("date-semantic");
      }

      if (colType === "number") {
        const avg =
          values.reduce((a, b) => a + Number(b || 0), 0) /
          (values.length || 1);

        if (avg < 1 && field.includes("unitprice")) score += 0.1;
        if (avg > 1 && field.includes("cost")) score += 0.1;
      }

      if (index < 3) score += 0.1;
      if (!hasMeaningfulHeader) score -= 0.15;

      return {
        field,
        score: Number(score.toFixed(2)),
        reasons,
      };
    });

    const sorted = suggestions
      .filter((s) => s.score >= 0.35)
      .sort((a, b) => b.score - a.score);

    const autoMapped =
      hasMeaningfulHeader &&
      rowCount > 1 &&
      sorted.length > 0 &&
      (sorted[0].reasons.includes("exact-header") ||
        sorted[0].reasons.includes("header-internal")) &&
      sorted[0].score >= 0.75;

    return {
      csvColumn,
      detectedType: colType,
      suggestions: sorted,
      autoMapped,
    };
  });
}

