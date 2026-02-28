import { Op } from "sequelize";
import sequelize from "../../../config/db.config.js";
import { AdminActivityLog, KcxAdmin } from "../../../models/index.js";

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildDateRange = (query = {}) => {
  const range = {};
  if (query.date_from) {
    range[Op.gte] = new Date(query.date_from);
  }
  if (query.date_to) {
    range[Op.lte] = new Date(query.date_to);
  }
  return Object.keys(range).length ? range : null;
};

const buildSearch = (term) => {
  if (!term) return null;
  const like = `%${String(term).trim()}%`;
  return {
    [Op.or]: [
      { description: { [Op.iLike]: like } },
      sequelize.where(sequelize.cast(sequelize.col("metadata"), "text"), {
        [Op.iLike]: like,
      }),
    ],
  };
};

const mapAdmins = async (rows) => {
  const ids = [...new Set(rows.map((row) => row.admin_id).filter(Boolean))];
  if (ids.length === 0) return new Map();
  const admins = await KcxAdmin.findAll({
    attributes: ["id", "email"],
    where: { id: ids },
    raw: true,
  });
  return new Map(admins.map((admin) => [admin.id, admin.email]));
};

export const listAdminLogs = async (query = {}) => {
  const page = Math.max(toInt(query.page, 1), 1);
  const limit = Math.min(Math.max(toInt(query.limit, 20), 1), 100);
  const offset = (page - 1) * limit;

  const where = {};
  if (query.admin_id) where.admin_id = query.admin_id;
  if (query.entity_type) where.entity_type = query.entity_type;
  if (query.event_type) where.event_type = query.event_type;

  const dateRange = buildDateRange(query);
  if (dateRange) where.created_at = dateRange;

  const search = buildSearch(query.search);
  if (search) Object.assign(where, search);

  const { rows, count } = await AdminActivityLog.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit,
    offset,
    raw: true,
  });

  const adminMap = await mapAdmins(rows);
  const items = rows.map((row) => ({
    ...row,
    admin_email: row.admin_id ? adminMap.get(row.admin_id) || null : null,
  }));

  return {
    items,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit) || 1,
  };
};

export const getFilters = async () => {
  const [admins, eventTypes, entityTypes] = await Promise.all([
    KcxAdmin.findAll({ attributes: ["id", "email"], order: [["email", "ASC"]], raw: true }),
    AdminActivityLog.findAll({
      attributes: [[sequelize.fn("DISTINCT", sequelize.col("event_type")), "event_type"]],
      raw: true,
    }),
    AdminActivityLog.findAll({
      attributes: [[sequelize.fn("DISTINCT", sequelize.col("entity_type")), "entity_type"]],
      raw: true,
    }),
  ]);

  const normalizeDistinct = (rows, key) =>
    rows.map((row) => row[key]).filter(Boolean).sort();

  return {
    admins,
    event_types: normalizeDistinct(eventTypes, "event_type"),
    entity_types: normalizeDistinct(entityTypes, "entity_type"),
  };
};
