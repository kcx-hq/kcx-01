import { assertDbReachable, closeDb } from "./helpers/db.js";
import { startTestDbContainer, stopTestDbContainer } from "./helpers/docker.js";
import { loadTestEnv } from "./helpers/env.js";
import { runMigrations } from "./helpers/migrate.js";
import { truncateAllTables } from "./helpers/truncate.js";

export default async function globalSetup() {
  loadTestEnv();

  if (["unit", "component"].includes(process.env.TEST_SUITE)) {
    return async () => {};
  }

  if (process.env.NODE_ENV !== "test") {
    throw new Error(`Invalid NODE_ENV "${process.env.NODE_ENV}" for test suite execution.`);
  }

  const dockerState = await startTestDbContainer();
  await assertDbReachable();
  await runMigrations({ startDocker: false });
  await truncateAllTables();

  return async () => {
    await closeDb();
    if (dockerState.startedByLifecycle) {
      await stopTestDbContainer();
    }
  };
}
