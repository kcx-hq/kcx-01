import {
  BillingDetectedColumn,
  BillingColumnMapping,
  MappingSuggestion,
} from "../../../models/index.js";
import { normalizeHeader } from "../../../utils/sanitize.js";
import { resolveMapping as resolveMappingFromHeaders } from "./lib/mapping.utils.js";

export async function storeDetectedColumns(provider, headers, clientid) {
  if (!headers?.length) {
    return;
  }

  const uniqueColumns = new Set(headers.map((header) => normalizeHeader(header)));
  const records = [...uniqueColumns].map((columnName) => ({
    provider,
    column_name: columnName,
    clientid,
  }));

  await BillingDetectedColumn.bulkCreate(records, {
    ignoreDuplicates: true,
  });
}

export async function loadMapping(provider, clientid) {
  const rows = await BillingColumnMapping.findAll({
    where: { provider, clientid },
  });

  const mapping = {};
  for (const row of rows) {
    mapping[row.internal_field] = row.source_column;
  }

  return mapping;
}

export function resolveMapping(mappingConfig, headers) {
  return resolveMappingFromHeaders(mappingConfig, headers);
}

export async function loadResolvedMapping(provider, headers, clientid) {
  const mappingConfig = await loadMapping(provider, clientid);
  return resolveMapping(mappingConfig, headers);
}

export async function storeAutoSuggestions(provider, uploadId, suggestions, clientid) {
  if (!suggestions?.length) {
    return;
  }

  const suggestionRows = [];
  const autoMappingRows = [];

  for (const column of suggestions) {
    const sourceColumn = column.csvColumn;

    for (const suggestion of column.suggestions || []) {
      suggestionRows.push({
        provider,
        uploadid: uploadId,
        source_column: sourceColumn,
        internal_field: suggestion.field,
        score: suggestion.score,
        automapped: column.autoMapped,
        clientid,
        reasons: suggestion.reasons ?? null,
      });
    }

    if (column.autoMapped && column.suggestions?.length) {
      autoMappingRows.push({
        provider,
        source_column: sourceColumn,
        internal_field: column.suggestions[0].field,
        clientid,
      });
    }
  }

  if (suggestionRows.length) {
    await MappingSuggestion.bulkCreate(suggestionRows, {
      ignoreDuplicates: true,
    });
  }

  if (autoMappingRows.length) {
    await BillingColumnMapping.bulkCreate(autoMappingRows, {
      ignoreDuplicates: true,
    });
  }
}
