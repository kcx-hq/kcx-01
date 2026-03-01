import { readCsvWithHeaders } from "../../../utils/csvReader.js";
import {
  collectDimensionRow,
  createDimensionsAccumulator,
} from "./dimensions/collectDimensions.js";
import { bulkUpsertDimensions } from "./dimensions/bulkUpsertDimensions.js";
import { preloadDimensionMaps } from "./dimensions/preloadDimensionsMaps.js";
import { resolveDimensionIdsFromMaps } from "./dimensions/resolveFromMaps.js";
import {
  pushFact,
  flushFacts,
  resetFactBuffer,
} from "./fact/billingUsageFact.js";
import sequelize from "../../../config/db.config.js";
import {
  loadResolvedMapping,
  storeAutoSuggestions,
  storeDetectedColumns,
} from "./mapping.service.js";
import { normalizeHeader } from "../../../utils/sanitize.js";
import { detectProvider } from "./provider-detect.service.js";
import { autoSuggest } from "../../../utils/mapping/autoSuggest.js";
import { internalFields } from "../../../utils/mapping/internalFields.js";

function buildCompiledMapping(mapping, headers) {
  const headerByNormalized = new Map();
  for (const header of headers || []) {
    if (typeof header !== "string") {
      continue;
    }
    headerByNormalized.set(normalizeHeader(header), header);
  }

  return Object.entries(mapping || {}).map(([internalField, sourceColumn]) => {
    if (typeof sourceColumn !== "string" || sourceColumn.trim() === "") {
      return [internalField, null];
    }

    const direct = headerByNormalized.get(normalizeHeader(sourceColumn));
    return [internalField, direct || sourceColumn];
  });
}

function mapRowWithCompiledMapping(rawRow, compiledMapping) {
  const result = {};

  for (const [internalField, sourceKey] of compiledMapping) {
    result[internalField] = sourceKey ? rawRow[sourceKey] ?? null : null;
  }

  return result;
}

export async function ingestBillingCsv({ uploadId, filePath, clientid }) {
  resetFactBuffer();

  const { headers, rows } = await readCsvWithHeaders(filePath);
  const provider = detectProvider(headers);

  await storeDetectedColumns(provider, headers, clientid);

  const suggestions = autoSuggest(headers, rows, internalFields);
  await storeAutoSuggestions(provider, uploadId, suggestions, clientid);

  const resolvedMapping = await loadResolvedMapping(provider, headers, clientid);
  const compiledMapping = buildCompiledMapping(resolvedMapping, headers);

  const dims = createDimensionsAccumulator();
  const mappedRows = new Array(rows.length);

  for (let idx = 0; idx < rows.length; idx += 1) {
    const mappedRow = mapRowWithCompiledMapping(rows[idx], compiledMapping);
    mappedRows[idx] = mappedRow;
    collectDimensionRow(mappedRow, dims);
  }

  const transaction = await sequelize.transaction();
  try {
    await bulkUpsertDimensions(dims, transaction);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  const maps = await preloadDimensionMaps(dims);

  for (const row of mappedRows) {
    const dimensionIds = resolveDimensionIdsFromMaps(row, maps);

    if (
      !dimensionIds.regionid ||
      !dimensionIds.cloudaccountid ||
      !dimensionIds.serviceid
    ) {
      continue;
    }

    await pushFact(uploadId, row, dimensionIds);
  }

  await flushFacts();
}
