import {
  getCommonFilters,
  getDateRangeFromRequest,
  getUploadIdsFromRequest,
} from "../../helpers/request.js";

export function getBaseParams(req) {
  const { startDate, endDate } = getDateRangeFromRequest(req);
  return {
    clientId: req.client_id,
    requestedUploadIds: getUploadIdsFromRequest(req),
    filters: getCommonFilters(req),
    startDate,
    endDate,
  };
}

export function getClientScope(req) {
  return {
    clientId: req.client_id,
    requestedUploadIds: getUploadIdsFromRequest(req),
  };
}

