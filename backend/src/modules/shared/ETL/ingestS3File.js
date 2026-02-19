
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { createGunzip } from "zlib";
import csv from "csv-parser";
import assumeRole from "../../../aws/assumeRole.js";
import sequelize from "../../../config/db.config.js";

import { collectDimensions } from "./dimensions/collectDimensions.js";
import { bulkUpsertDimensions } from "./dimensions/bulkUpsertDimensions.js";
import { preloadDimensionMaps } from "./dimensions/preloadDimensionsMaps.js";
import { resolveDimensionIdsFromMaps } from "./dimensions/resolveFromMaps.js";
import { pushFact, flushFacts } from "./fact/billingUsageFact.js";
import {
  loadResolvedMapping,
  storeAutoSuggestions,
  storeDetectedColumns,
} from "./mapping.service.js";
import { mapRow } from "../../../utils/sanitize.js";
import { detectProvider } from "./provider-detect.service.js";
import { autoSuggest } from "../../../utils/mapping/autoSuggest.js";
import { internalFields } from "../../../utils/mapping/internalFields.js";


export async function ingestS3File({ 
  s3Key,
  clientid,
  uploadId,
  Bucket , clientcreds = null,
  region = "ap-south-1",
  assumeRoleOptions = null,
}){
  try {
    const creds = await assumeRole( {region , clientcreds , assumeRoleOptions  });


    const s3 = new S3Client({
      region: region,
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

    // Resolve mapping even for small files (<200 rows), then map all rows.
    const suggestionRows = sampleRows.slice(0, 200);
    const suggestions = autoSuggest(headers, suggestionRows, internalFields);

    await storeAutoSuggestions(provider, uploadId, suggestions, clientid);

    const resolvedMapping = await loadResolvedMapping(
      provider,
      headers,
      clientid
    );

    const mappedRowsForDims = sampleRows.map((rawRow) =>
      mapRow(rawRow, resolvedMapping)
    );

    /* ======================
       DIMENSIONS UPSERT
    ======================= */

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

    for (const row of mappedRowsForDims) {
      const dimensionIds = resolveDimensionIdsFromMaps(row, maps);

      if (
        !dimensionIds.regionid ||
        !dimensionIds.cloudaccountid ||
        !dimensionIds.commitmentdiscountid ||
        !dimensionIds.resourceid ||
        !dimensionIds.serviceid ||
        !dimensionIds.skuid
      ) continue;

      await pushFact(uploadId, row, dimensionIds);
    }

    await flushFacts();

    console.log("✅ Direct ETL complete");
  } catch (err) {
    console.error("❌ ETL failed:", err);
  }
}
