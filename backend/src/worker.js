import { Bucket$ } from "@aws-sdk/client-s3";
import sequelize from "./config/db.config.js";
import { pollClient } from "./modules/shared/ETL/polling.service.js";

const INTERVAL_MS = 2 * 60 * 1000; // 30 minutes

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
async function main() {
  await sequelize.authenticate();
  console.log("✅ Worker connected to DB");

  while (true) {
    const started = Date.now();
    try {
      console.log("🔁 Poll cycle started");
      await pollClient({ clientid : "e757b872-9f72-45d0-9003-f48247a580c5" , 
        Bucket : "kcx-msu-billing" , 
        prefix : "demo/kcx-msu/data/test",
        uploadedby : "f978b633-2075-4670-a4ec-778eb8f7f903"
      });
      console.log("✅ Poll cycle done");
    } catch (e) {
      console.error("❌ Poll cycle failed:", e);
    }

    const took = Date.now() - started;
    const wait = Math.max(10_000, INTERVAL_MS - took); // at least 10s
    console.log(`⏳ Sleeping ${(wait / 1000).toFixed(0)}s`);
    await sleep(wait);
  }
}

main().catch((e) => {
  console.error("Worker crashed:", e);
  process.exit(1);
});
