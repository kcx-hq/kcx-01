import {
  connectAwsCloud,
  listCloudFiles,
  selectCloudFileForIngestion,
  verifyAwsConnection,
} from "./cloud.service.js";

export async function verifyAwsRoleConnection(req, res) {
  try {
    const { accountId, roleName, bucketPrefix, region } = req.body || {};
    const result = await verifyAwsConnection({
      accountId,
      roleName,
      bucketPrefix,
      region,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error?.message || "AWS connection verification failed",
    });
  }
}

export async function connectAwsRole(req, res) {
  try {
    const { accountId, roleName, bucketPrefix, region } = req.body || {};
    const result = await connectAwsCloud({
      accountId,
      roleName,
      bucketPrefix,
      region,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error?.message || "AWS connection setup failed",
    });
  }
}

export async function getCloudConnectionFiles(req, res) {
  try {
    const { accountId, roleName, bucketPrefix, region, path } = req.body || {};
    const result = await listCloudFiles({
      accountId,
      roleName,
      bucketPrefix,
      region,
      path: path || "",
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error?.message || "Unable to load cloud files",
    });
  }
}

export async function selectCloudFile(req, res) {
  try {
    const { accountId, roleName, bucketPrefix, region, filePath } = req.body || {};
    const result = await selectCloudFileForIngestion({
      accountId,
      roleName,
      bucketPrefix,
      region,
      filePath,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error?.message || "Unable to select file for ingestion",
    });
  }
}
