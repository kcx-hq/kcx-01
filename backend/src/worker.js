import sequelize from "./config/db.config.js";
import { pollClient } from "./modules/shared/ETL/polling.service.js";

const INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sleepWithCountdown(ms) {
  let remaining = Math.ceil(ms / 1000);

  while (remaining > 0) {
    process.stdout.write(`\r⏳ Next poll in ${remaining}s   `);
    await sleep(1000);
    remaining--;
  }

  process.stdout.write("\r"); // clear line
}

async function main() {
  await sequelize.authenticate();
  console.log("✅ Worker connected to DB");

  while (true) {
    const started = Date.now();

    try {
      console.log("\n🔁 Poll cycle started");

      await pollClient({
        clientid: "215eff15-bd75-44d0-bf06-ffee9122f38c",
        Bucket: "kcx-msu-billing",
        prefix: "demo/kcx-msu/data/test",
        uploadedby: "1f614495-beff-4f27-aa0f-7fff246a8dfa",
      });

      console.log("✅ Poll cycle done");
    } catch (e) {
      console.error("❌ Poll cycle failed:", e);
    }

    const took = Date.now() - started;
    const wait = Math.max(10_000, INTERVAL_MS - took);

    console.log(`⏳ Sleeping for ${(wait / 1000).toFixed(0)} seconds...`);

    await sleepWithCountdown(wait);
  }
}

main().catch((e) => {
  console.error("Worker crashed:", e);
  process.exit(1);
});
