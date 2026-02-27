import { afterAll, afterEach } from "vitest";
import { closeDb } from "./helpers/db.js";
import { loadTestEnv } from "./helpers/env.js";
import { registerCustomMatchers } from "./helpers/matchers.js";
import { restoreTime } from "./helpers/time.js";
import { truncateAllTables } from "./helpers/truncate.js";

const isDbSuite = !["unit", "component"].includes(process.env.TEST_SUITE);

loadTestEnv();
registerCustomMatchers();

afterEach(async () => {
  restoreTime();
  if (isDbSuite) {
    await truncateAllTables();
  }
});

afterAll(async () => {
  if (isDbSuite) {
    await closeDb();
  }
});
