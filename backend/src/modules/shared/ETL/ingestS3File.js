import { createRequire } from "module";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { createGunzip } from "zlib";
import csv from "csv-parser";
import assumeRole from "../../../aws/assumeRole.js";
import { collectDimensions } from "./dimensions/collectDimensions.js";
import { bulkUpsertDimensions } from "./dimensions/bulkUpsertDimensions.js";
import { preloadDimensionMaps } from "./dimensions/preloadDimensionsMaps.js";
import { resolveDimensionIdsFromMaps } from "./dimensions/resolveFromMaps.js";
import { pushFact, flushFacts, resetFactBuffer, getFactStats } from "./fact/billingUsageFact.js";
import {
  loadResolvedMapping,
  storeAutoSuggestions,
  storeDetectedColumns,
} from "./mapping.service.js";
import { mapRow } from "../../../utils/sanitize.js";
import { detectProvider } from "./provider-detect.service.js";
import { autoSuggest } from "../../../utils/mapping/autoSuggest.js";
import { internalFields } from "../../../utils/mapping/internalFields.js";
import logger from "../../../lib/logger.js";

const require = createRequire(import.meta.url);
const { sequelize } = require("../../../db/index.cjs");

export async function ingestS3File({
  s3Key,
  clientid,
  uploadId,
  Bucket,
  clientcreds = null,
  region = "ap-south-1",
  assumeRoleOptions = null,
}){
  resetFactBuffer();
  const creds = await assumeRole( {region , clientcreds , assumeRoleOptions  });


    const s3 = new S3Client({
      region,
      credentials: creds,
    });

    const response = await s3.send(
      new GetObjectCommand({
        Bucket,
        Key: s3Key,
      })
    );

    const isGzip = s3Key.toLowerCase().endsWith(".gz");
    const inputStream = isGzip
      ? response.Body.pipe(createGunzip())
      : response.Body;

    const csvStream = inputStream.pipe(csv());

    let headers;
    let provider;
    const sampleRows = [];

    let isFirstRow = true;

    for await (const rawRow of csvStream) {
      if (isFirstRow) {
        headers = Object.keys(rawRow);
        provider = detectProvider(headers);
        await storeDetectedColumns(provider, headers, clientid);
        isFirstRow = false;
      }

      sampleRows.push(rawRow);
    }

    const suggestionRows = sampleRows.slice(0, 200);
    const suggestions = autoSuggest(headers, suggestionRows, internalFields);

    await storeAutoSuggestions(provider, uploadId, suggestions, clientid);

    const resolvedMapping = await loadResolvedMapping(provider, headers, clientid);

    const mappedRowsForDims = sampleRows.map((rawRow) =>
      mapRow(rawRow, resolvedMapping)
    );

    const dims = await collectDimensions(mappedRowsForDims);

    const transaction = await sequelize.transaction();
    try {
      await bulkUpsertDimensions(dims, transaction);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    const maps = await preloadDimensionMaps();

    /* ======================
       FACT INSERT
    ======================= */

    let skippedRows = 0;
    for (const row of mappedRowsForDims) {
      const dimensionIds = resolveDimensionIdsFromMaps(row, maps);

      // Keep ingestion permissive: only core dimensions are mandatory.
      // Optional dimensions (resource, sku, commitment discount) can be null.
      if (
        !dimensionIds.regionid ||
        !dimensionIds.cloudaccountid ||
        !dimensionIds.commitmentdiscountid ||
        !dimensionIds.resourceid ||
        !dimensionIds.serviceid ||
        !dimensionIds.skuid
      ) {
        skippedRows += 1;
        continue;
      }

      await pushFact(uploadId, row, dimensionIds);
    }

    await flushFacts();

    const stats = getFactStats();
    console.log("✅ Direct ETL complete");
    return { attempted: stats.attempted, skipped: skippedRows, totalRows: mappedRowsForDims.length };
}
