import { normalizeHeader } from "../../../../utils/sanitize.js";

export function resolveMapping(mappingConfig, headers) {
  const normalizedHeaders = headers.map((header) => ({
    raw: header,
    norm: normalizeHeader(header),
  }));

  const resolved = {};

  for (const internalField in mappingConfig) {
    let candidates = mappingConfig[internalField];

    if (!Array.isArray(candidates)) {
      if (typeof candidates === "string") {
        candidates = [candidates];
      } else if (typeof candidates === "object" && candidates !== null) {
        candidates = [candidates.source_column];
      } else {
        candidates = [];
      }
    }

    const match = normalizedHeaders.find((header) =>
      candidates.some(
        (candidate) => normalizeHeader(candidate) === header.norm,
      ),
    );

    resolved[internalField] = match?.raw || null;
  }

  return resolved;
}
