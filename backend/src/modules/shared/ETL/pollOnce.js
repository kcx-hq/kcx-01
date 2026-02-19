// pollOnce.js
import { ClientS3Integrations } from "../../../models/index.js";
import { pollClient } from "./pollClient.js";

export async function pollOnce() {
  console.log("🧾 Fetching enabled client integrations...");

  const integrations = await ClientS3Integrations.findAll({
    where: { enabled: true },
    attributes: [
      "clientid",
      "bucket",
      "prefix",
      "region",
    ],
  });

  console.log(`🔢 Found ${integrations.length} active client(s)`);

  for (const integration of integrations) {
    try {
      console.log(
        `\n👤 Polling client=${integration.clientid} bucket=${integration.bucket}`
      );

      await pollClient({
        clientid: integration.clientid,
        Bucket: integration.bucket,
        prefix: integration.prefix,
        uploadedby: "00000000-0000-0000-0000-000000000001", // replace with your system user id
      });

      console.log(`✅ Completed client=${integration.clientid}`);
    } catch (err) {
      console.error(
        `❌ Failed client=${integration.clientid}:`,
        err
      );
    }
  }
}
