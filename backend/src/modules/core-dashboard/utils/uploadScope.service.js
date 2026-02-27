import AppError from "../../../errors/AppError.js";
import { BillingUpload } from "../../../models/index.js";
import { normalizeUploadIds } from "./uploadIds.utils.js";

function uniqueUploadIds(uploadIds) {
  const deduped = new Set();
  const ordered = [];

  for (const uploadId of normalizeUploadIds(uploadIds)) {
    if (!deduped.has(uploadId)) {
      deduped.add(uploadId);
      ordered.push(uploadId);
    }
  }

  return ordered;
}

export async function assertUploadScope({ uploadIds, clientId }) {
  const normalizedUploadIds = uniqueUploadIds(uploadIds);
  if (!normalizedUploadIds.length) {
    return [];
  }

  if (!String(clientId || "").trim()) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  }

  const ownedUploads = await BillingUpload.findAll({
    where: {
      clientid: clientId,
      uploadid: normalizedUploadIds,
    },
    attributes: ["uploadid"],
    raw: true,
  });

  const ownedSet = new Set(ownedUploads.map((row) => row.uploadid));
  const hasForeignUpload = normalizedUploadIds.some((uploadId) => !ownedSet.has(uploadId));

  if (hasForeignUpload) {
    throw new AppError(
      403,
      "UNAUTHORIZED",
      "You do not have permission to perform this action",
    );
  }

  return normalizedUploadIds;
}

export { uniqueUploadIds };
