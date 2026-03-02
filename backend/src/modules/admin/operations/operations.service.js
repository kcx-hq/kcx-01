import { BillingUpload, Client, User } from "../../../models/index.js";

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const listUploads = async (query = {}) => {
  const page = Math.max(toInt(query.page, 1), 1);
  const limit = Math.min(Math.max(toInt(query.limit, 20), 1), 100);
  const offset = (page - 1) * limit;

  const { rows, count } = await BillingUpload.findAndCountAll({
    attributes: [
      "uploadid",
      "clientid",
      "uploadedby",
      "filename",
      "filesize",
      "uploadedat",
      "status",
    ],
    include: [
      { model: Client, as: "client", attributes: ["id", "name"] },
      { model: User, as: "uploadedBy", attributes: ["id", "full_name"] },
    ],
    order: [["uploadedat", "DESC"]],
    limit,
    offset,
  });

  return {
    items: rows,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit) || 1,
  };
};

export const getUploadById = async (id) => {
  return await BillingUpload.findByPk(id, {
    attributes: [
      "uploadid",
      "clientid",
      "uploadedby",
      "filename",
      "filesize",
      "uploadedat",
      "status",
      "billingperiodstart",
      "billingperiodend",
    ],
    include: [
      { model: Client, as: "client", attributes: ["id", "name"] },
      { model: User, as: "uploadedBy", attributes: ["id", "full_name"] },
    ],
  });
};
