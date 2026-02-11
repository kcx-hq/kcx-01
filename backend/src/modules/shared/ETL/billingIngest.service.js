import { readCsv, readCsvWithHeaders } from "../../../utils/csvReader.js";
import { collectDimensions } from "./dimensions/collectDimensions.js";
import { bulkUpsertDimensions } from "./dimensions/bulkUpsertDimensions.js";
import { preloadDimensionMaps } from "./dimensions/preloadDimensionsMaps.js";
import { resolveDimensionIdsFromMaps } from "./dimensions/resolveFromMaps.js";
import { pushFact, flushFacts } from "./fact/billingUsageFact.js";
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
import { msSince } from "../../../utils/test/timer.js";

export async function ingestBillingCsv({ uploadId, filePath, clientid }) {
  const t0 = process.hrtime.bigint();
  const marks = {};
  const mark = (name) => (marks[name] = msSince(t0));

  // helpful counters
  let rowCount = 0;
  let mappedCount = 0;
  let dimsCount = 0;
  let factsPushed = 0;
  let factsSkipped = 0;

  try {
    /* 1) Read CSV + headers */
    const { headers, rows } = await readCsvWithHeaders(filePath);
    rowCount = rows?.length || 0;
    mark("after readCsvWithHeaders");

    /* 2) Provider detect */
    const provider = detectProvider(headers);
    mark("after detectProvider");

    /* 3) Store detected columns */
    await storeDetectedColumns(provider, headers, clientid);
    mark("after storeDetectedColumns");

    /* 4) Auto suggest + store suggestions */
    const suggestions = autoSuggest(headers, rows, internalFields);
    mark("after autoSuggest");

    await storeAutoSuggestions(provider, uploadId, suggestions, clientid);
    mark("after storeAutoSuggestions");

    /* 5) Load resolved mapping */
    const resolvedMapping = await loadResolvedMapping(provider, headers, clientid);
    mark("after loadResolvedMapping");

    /* 6) Map rows */
    const mappedRows = rows.map((raw) => mapRow(raw, resolvedMapping));
    mappedCount = mappedRows.length;
    mark("after mapRows");

    /* 7) Collect dims */
    const dims = await collectDimensions(mappedRows);
    // dims structure varies; log something useful
    dimsCount =
      Array.isArray(dims) ? dims.length : typeof dims === "object" && dims ? Object.keys(dims).length : 0;
    mark("after collectDimensions");

    /* 8) Upsert dims (transaction) */
    const transaction = await sequelize.transaction();
    try {
      await bulkUpsertDimensions(dims, transaction , mark);
      await transaction.commit();
      mark("after bulkUpsertDimensions commit");
    } catch (err) {
      await transaction.rollback();
      mark("after bulkUpsertDimensions rollback");
      throw err;
    }

    /* 9) Preload dimension maps */
    const maps = await preloadDimensionMaps(dims);
    mark("after preloadDimensionMaps");

    /* 10) Push facts loop */
    const loopStart = process.hrtime.bigint();

    for (const row of mappedRows) {
      const dimensionIds = resolveDimensionIdsFromMaps(row, maps);

      if (
        !dimensionIds.regionid ||
        !dimensionIds.cloudaccountid ||
        !dimensionIds.commitmentdiscountid ||
        !dimensionIds.resourceid ||
        !dimensionIds.serviceid ||
        !dimensionIds.skuid
      ) {
        factsSkipped++;
        continue;
      }

      await pushFact(uploadId, row, dimensionIds);
      factsPushed++;
    }

    const loopMs = Number(process.hrtime.bigint() - loopStart) / 1e6;
    marks["facts_loop_ms"] = Number(loopMs.toFixed(2));
    mark("after pushFact loop");

    /* 11) Flush facts */
    await flushFacts();
    mark("after flushFacts");

    console.log(
      JSON.stringify({
        type: "ingestBillingCsv_breakdown",
        uploadId,
        clientid,
        provider,
        marks,
        total_ms: msSince(t0),
        counts: {
          rows: rowCount,
          mappedRows: mappedCount,
          dims: dimsCount,
          factsPushed,
          factsSkipped,
        },
      })
    );
  } catch (err) {
    console.error("ingestBillingCsv error:", err);

    console.log(
      JSON.stringify({
        type: "ingestBillingCsv_breakdown_error",
        uploadId,
        clientid,
        marks,
        total_ms: msSince(t0),
        counts: {
          rows: rowCount,
          mappedRows: mappedCount,
          dims: dimsCount,
          factsPushed,
          factsSkipped,
        },
        error: err.message,
      })
    );

    throw err;
  }
}
