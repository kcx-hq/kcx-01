import AppError from "../../../errors/AppError.js";
import {
  connectAwsCloud,
  listCloudFiles,
  selectCloudFileForIngestion,
  verifyAwsConnection,
} from "./cloud.service.js";

export async function verifyAwsRoleConnection(req, res, next) {
  try {
    const { accountId, roleName, bucketPrefix, region } = req.body || {};
    const result = await verifyAwsConnection({
      accountId,
      roleName,
      bucketPrefix,
      region,
    });
    return res.ok(result);
  } catch (error) {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
  }
}

export async function connectAwsRole(req, res, next) {
  try {
    const { accountId, roleName, bucketPrefix, region } = req.body || {};
    const result = await connectAwsCloud({
      accountId,
      roleName,
      bucketPrefix,
      region,
    });
    return res.ok(result);
  } catch (error) {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
  }
}

export async function getCloudConnectionFiles(req, res, next) {
  try {
    const { accountId, roleName, bucketPrefix, region, path } = req.body || {};
    const result = await listCloudFiles({
      accountId,
      roleName,
      bucketPrefix,
      region,
      path: path || "",
    });
    return res.ok(result);
  } catch (error) {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
  }
}

export async function selectCloudFile(req, res, next) {
  try {
    const { accountId, roleName, bucketPrefix, region, filePath } = req.body || {};
    const result = await selectCloudFileForIngestion({
      clientId: req.client_id,
      userId: req.user?.id,
      accountId,
      roleName,
      bucketPrefix,
      region,
      filePath,
    });
    return res.ok(result);
  } catch (error) {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid request", { cause: error }));
  }
}
