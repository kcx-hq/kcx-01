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
    ignoreDuplicates: true, 
    returning : false 
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

const chunk = (arr, size = 1000) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export async function storeAutoSuggestions(provider, uploadId, suggestions, clientid, transaction) {
  if (!suggestions?.length) return;

  const suggestionRows = [];
  const autoMappingRows = [];

  // Build buffers in memory
  for (const col of suggestions) {
    const sourceColumn = col.csvColumn;
    const list = col.suggestions || [];

    for (const s of list) {
      suggestionRows.push({
        provider,
        uploadid: uploadId,
        source_column: sourceColumn,
        internal_field: s.field,
        score: s.score,
        automapped: !!col.autoMapped,
        clientid,
        reasons: s.reasons ?? null,
        status: "suggested", // if your table has it (your logs show status)
      });
    }

    // Capture auto-mapped columns
    if (col.autoMapped && list.length) {
      autoMappingRows.push({
        provider,
        source_column: sourceColumn,
        internal_field: list[0].field,
        clientid,
        priority: 1, // if you use priority
        createdAt: new Date(), // if required by schema
      });
    }
  }

  // 1) Bulk insert suggestions (chunked)
  if (suggestionRows.length) {
    for (const batch of chunk(suggestionRows, 1000)) {
      await MappingSuggestion.bulkCreate(batch, {
        ignoreDuplicates: true,
        returning: false,
        transaction,
      });
    }
  }

  // 2) Bulk UPSERT auto mappings (better than ignoreDuplicates)
  if (autoMappingRows.length) {
    for (const batch of chunk(autoMappingRows, 1000)) {
      await BillingColumnMapping.bulkCreate(batch, {
        updateOnDuplicate: ["internal_field", "priority"], // update what should change
        returning: false,
        transaction,
      });
    }
  }
}

