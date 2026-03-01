import { readCsv, readCsvHeaders } from "../../../utils/csvReader.js";
import {
  createDimensionsAccumulator,
  collectDimensionRow,
} from "./dimensions/collectDimensions.js";
import { bulkUpsertDimensions } from "./dimensions/bulkUpsertDimensions.js";
import { preloadDimensionMaps } from "./dimensions/preloadDimensionsMaps.js";
import { resolveDimensionIdsFromMaps } from "./dimensions/resolveFromMaps.js";
import {
  pushFact,
  flushFacts,
  resetFactBuffer,
  getFactStats,
} from "./fact/billingUsageFact.js";
import sequelize from "../../../config/db.config.js";
import {
  loadResolvedMapping,
  storeAutoSuggestions,
  storeDetectedColumns,
} from "./mapping.service.js";
import { mapRow } from "../../../utils/sanitize.js";
import { detectProvider } from "./provider-detect.service.js";
import { autoSuggest } from "../../../utils/mapping/autoSuggest.js";
import { internalFields } from "../../../utils/mapping/internalFields.js";
export async function ingestBillingCsv({ uploadId, filePath, clientid }) {
  resetFactBuffer();
  // 1️⃣ Detect provider & headers
  const { headers, rows } = await readCsvWithHeaders(filePath);

  const provider = detectProvider(headers);

  await storeDetectedColumns(provider, headers, clientid); // buffer

  const suggestions = autoSuggest(headers, rows, internalFields);

  await storeAutoSuggestions(provider, uploadId, suggestions, clientid);
  const resolvedMapping = await loadResolvedMapping(
    provider,
    headers,
    clientid,
  );

  const mappedRows = rows.map((raw) => mapRow(raw, resolvedMapping));

  const dims = await collectDimensions(mappedRows);

  const transaction = await sequelize.transaction();
  try {
    await bulkUpsertDimensions(dims, transaction);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  const maps = await preloadDimensionMaps();
  for await (const row of mappedRows) {
    const dimensionIds = resolveDimensionIdsFromMaps(row, maps);

    // Only core dimensions are mandatory as per BillingUsageFact model:
    // uploadid (provided), cloudaccountid, serviceid, regionid
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
