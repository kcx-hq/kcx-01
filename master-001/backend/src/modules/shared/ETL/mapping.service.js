import {
  BillingDetectedColumn,
  BillingColumnMapping,
  MappingSuggestion
} from "../../../models/index.js";
import { normalizeHeader } from "../../../utils/sanitize.js";


export async function storeDetectedColumns(provider, headers , clientid) {
  if (!headers?.length) return;

  /* 1️⃣ Normalize & dedupe in memory */
  const uniqueColumns = new Set(
    headers.map(h => normalizeHeader(h))
  );

  /* 2️⃣ Prepare bulk payload */
  const records = [...uniqueColumns].map(col => ({
    provider,
    column_name: col,
    clientid : clientid
  }));

  /* 3️⃣ Bulk insert (ignore existing) */
  await BillingDetectedColumn.bulkCreate(records, {
    ignoreDuplicates: true, // MySQL / Postgres
  });
}

export async function loadMapping(provider , clientid) {
  const rows = await BillingColumnMapping.findAll({
    where: { provider , clientid },
  });

  const mapping = {};
  for (const row of rows) {
    mapping[row.internal_field] = row.source_column;
  }

  return mapping;
}


export function resolveMapping(mappingConfig, headers) {
  const normalizedHeaders = headers.map(h => ({
    raw: h,
    norm: normalizeHeader(h),
  }));

  const resolved = {};

  for (const internalField in mappingConfig) {
    let candidates = mappingConfig[internalField];

    // ✅ Normalize candidates to array
    if (!Array.isArray(candidates)) {
      if (typeof candidates === "string") {
        candidates = [candidates];
      } else if (typeof candidates === "object" && candidates !== null) {
        candidates = [candidates.source_column];
      } else {
        candidates = [];
      }
    }

    const match = normalizedHeaders.find(h =>
      candidates.some(c => normalizeHeader(c) === h.norm)
    );

    resolved[internalField] = match?.raw || null;
  }

  return resolved;
}




export async function loadResolvedMapping(provider, headers , clientid) {
  const mappingConfig = await loadMapping(provider , clientid);

  // Returns { internalField: csvColumnName | null }
  const resolvedMapping = resolveMapping(mappingConfig, headers);

  

  return resolvedMapping;
}

// mapping.service.js

export async function storeAutoSuggestions(provider, uploadId, suggestions , clientid) {
  if (!suggestions?.length) return;

  const suggestionRows = [];
  const autoMappingRows = [];

  /* 1️⃣ Build buffers in memory */
  for (const col of suggestions) {
    const sourceColumn = col.csvColumn;

    for (const s of col.suggestions || []) {
      suggestionRows.push({
        provider,
        uploadid: uploadId,
        source_column: sourceColumn,
        internal_field: s.field,
        score: s.score,
        automapped: col.autoMapped,
        clientid , 
        reasons: s.reasons ?? null,
      });
    }

    /* 2️⃣ Capture auto-mapped columns */
    if (col.autoMapped && col.suggestions?.length) {
      autoMappingRows.push({
        provider,
        source_column: sourceColumn,
        internal_field: col.suggestions[0].field,
        clientid
      });
    }
  }

  /* 3️⃣ Bulk insert suggestions */
  if (suggestionRows.length) {
    await MappingSuggestion.bulkCreate(suggestionRows, {
      ignoreDuplicates: true, // requires unique index
    });
  }

  /* 4️⃣ Bulk upsert auto mappings */
  if (autoMappingRows.length) {
    await BillingColumnMapping.bulkCreate(autoMappingRows, {
      ignoreDuplicates: true,
    });
  }
}

