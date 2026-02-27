import { ClientS3Integrations } from "../../../models/index.js";
import { pollClient } from "./pollClient.js";
import logger from "../../../lib/logger.js";
import {
  buildPollJobPayload,
  isPollCandidate,
  sortIntegrationsForPolling,
  toWorkerErrorMessage,
} from "./lib/pollWorker.utils.js";

async function persistPollResult({
  integration,
  integrationModel,
  now,
  errorMessage = null,
}) {
  const updatePayload = errorMessage
    ? { lasterror: errorMessage }
    : { lastpolledat: now, lasterror: null };

  if (typeof integration?.update === "function") {
    await integration.update(updatePayload);
    return;
  }

  if (integration?.id) {
    await integrationModel.update(updatePayload, {
      where: { id: integration.id },
    });
  }
}

export async function runPollWorkerTick(options = {}) {
  const {
    now = new Date(),
    integrationModel = ClientS3Integrations,
    pollClientFn = pollClient,
    loggerInstance = logger,
  } = options;

  loggerInstance.info("fetching enabled client integrations");

  const rawIntegrations = await integrationModel.findAll({
    where: { enabled: true },
    attributes: [
      "id",
      "clientid",
      "bucket",
      "prefix",
      "region",
      "enabled",
      "lastpolledat",
      "lasterror",
    ],
  });

  const integrations = sortIntegrationsForPolling(rawIntegrations).filter(isPollCandidate);

  loggerInstance.info({ integrationCount: integrations.length }, "active client integrations");

  const results = [];

  for (const integration of integrations) {
    try {
      loggerInstance.info(
        { clientid: integration.clientid, bucket: integration.bucket },
        "polling client integration"
      );

      await pollClientFn(buildPollJobPayload(integration));
      await persistPollResult({
        integration,
        integrationModel,
        now,
      });

      loggerInstance.info({ clientid: integration.clientid }, "completed client polling");
      results.push({
        integrationId: integration.id,
        clientid: integration.clientid,
        status: "completed",
      });
    } catch (err) {
      const errorMessage = toWorkerErrorMessage(err);
      await persistPollResult({
        integration,
        integrationModel,
        now,
        errorMessage,
      });
      loggerInstance.error({ err, clientid: integration.clientid }, "failed client polling");
      results.push({
        integrationId: integration.id,
        clientid: integration.clientid,
        status: "failed",
        errorMessage,
      });
    }
  }

  return {
    processed: results.length,
    succeeded: results.filter((result) => result.status === "completed").length,
    failed: results.filter((result) => result.status === "failed").length,
    results,
  };
}

export async function pollOnce() {
  return runPollWorkerTick();
}
