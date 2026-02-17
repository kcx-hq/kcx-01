import { verifyAwsConnection } from "./cloud.service.js";

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
