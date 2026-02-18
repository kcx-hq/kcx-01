import {CloudAccountCredentials} from "../../../models/index.js";

export async function createCloudAccountCredential(req, res) {
  try {
    const { clientId, accountId, accessKey, secretAccessKey, region } = req.body;

    // Basic validation
    if (!clientId || !accountId || !accessKey || !secretAccessKey || !region) {
      return res.status(400).json({
        error: "clientId, accountId, accessKey, secretAccessKey and region are required",
      });
    }

    const record = await CloudAccountCredentials.create({
      clientId,
      accountId,
      accessKey,
      secretAccessKey,
      region,
    });

    // NEVER return decrypted secrets
    return res.status(201).json({
      message: "Cloud account credentials added successfully",
      data: {
        id: record.id,
        clientId: record.clientId,
        accountId: record.accountId,
        region: record.region,
      },
    });
  } catch (error) {
    console.error("Error creating cloud account credential:", error);

    // Unique constraint error
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "This clientId + accountId combination already exists",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
