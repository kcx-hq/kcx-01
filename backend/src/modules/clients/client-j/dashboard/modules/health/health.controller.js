import { handleControllerError, sendSuccess } from "../../common/controller.utils.js";
import { getHealthStatus } from "./health.service.js";

export async function getHealth(_req, res) {
  try {
    const data = await getHealthStatus();
    return sendSuccess(res, data);
  } catch (error) {
    return handleControllerError(res, error, "Failed to fetch health status");
  }
}

