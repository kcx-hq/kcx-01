import { createRequire } from "module";
import { createRequire } from "module";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { createGunzip } from "zlib";
import csv from "csv-parser";
import assumeRole from "../../../aws/assumeRole.js";
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
import logger from "../../../lib/logger.js";
import logger from "../../../lib/logger.js";

const require = createRequire(import.meta.url);
const { sequelize } = require("../../../db/index.cjs");
const require = createRequire(import.meta.url);
const { sequelize } = require("../../../db/index.cjs");

async function ingest() {
  try {
    const s3Key = process.argv[2];
    const clientid = "e757b872-9f72-45d0-9003-f48247a580c5";
    const uploadId = "dc9da399-22a7-4e3e-aaf7-f8c74f158377";
    const uploadId = "dc9da399-22a7-4e3e-aaf7-f8c74f158377";
    const creds = await assumeRole();

    const s3 = new S3Client({
      region: "ap-south-1",
      credentials: creds,
    });
    const Bucket = "kcx-msu-billing";

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
    let resolvedMapping;

    const sampleRows = [];
    const mappedRowsForDims = [];

    let isFirstRow = true;

    for await (const rawRow of csvStream) {
      if (isFirstRow) {
        headers = Object.keys(rawRow);
        provider = detectProvider(headers);

        await storeDetectedColumns(provider, headers, clientid);

        isFirstRow = false;
      }

      sampleRows.push(rawRow);

      if (sampleRows.length === 200 && !resolvedMapping) {
        const suggestions = autoSuggest(headers, sampleRows, internalFields);

        await storeAutoSuggestions(provider, uploadId, suggestions, clientid);

        resolvedMapping = await loadResolvedMapping(provider, headers, clientid);
        resolvedMapping = await loadResolvedMapping(provider, headers, clientid);
      }

      if (resolvedMapping) {
        const mapped = mapRow(rawRow, resolvedMapping);
        mappedRowsForDims.push(mapped);
      }
    }

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

    for (const row of mappedRowsForDims) {
      const dimensionIds = resolveDimensionIdsFromMaps(row, maps);

      // Keep ingestion permissive: only core dimensions are mandatory.
      // Optional dimensions (resource, sku, commitment discount) can be null.
      // Keep ingestion permissive: only core dimensions are mandatory.
      // Optional dimensions (resource, sku, commitment discount) can be null.
      if (
        !dimensionIds.regionid ||
        !dimensionIds.cloudaccountid ||
        !dimensionIds.serviceid
        !dimensionIds.serviceid
      ) continue;

      if (pushFact(uploadId, row, dimensionIds)) {
        await flushFacts(uploadId);
      }
    }

    await flushFacts();
    logger.info({ uploadId, clientid, bucket: Bucket }, "direct ETL complete");
  } catch (err) {
    logger.error({ err }, "direct ETL failed");
    logger.error({ err }, "direct ETL failed");
  }
}

ingest()

