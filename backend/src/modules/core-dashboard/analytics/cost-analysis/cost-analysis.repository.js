import {
  BillingUsageFact,
  CloudAccount,
  Service,
  Region,
  Resource,
} from "../../../../models/index.js";
import { Op, fn, col, literal } from "sequelize";
import sequelize from "../../../../config/db.config.js";

const Sequelize = sequelize;

/**
 * Grouping configuration
 */
const getGroupConfig = (groupByParam) => {
  switch (groupByParam) {
    case "RegionName":
      return {
        col: "regionid",
        model: Region,
        nameCol: "regionname",
      };

    case "ProviderName":
      return {
        col: "cloudaccountid",
        model: CloudAccount,
        nameCol: "providername",
      };

    case "ServiceName":
    default:
      return {
        col: "serviceid",
        model: Service,
        nameCol: "servicename",
      };
  }
};

/**
 * Repository
 */
export const costAnalysisRepository = {
  // ============================================================
  //  SECTION 1: FILTER RESOLUTION (NO JOINS)
  // ============================================================

  /**
   * Resolve frontend filters (names) → IDs
   * uploadIds is REQUIRED for data isolation
   */
  async _resolveFiltersToIds(filters = {}) {
    const { provider, service, region, uploadIds: rawUploadIds } = filters;

    const uploadIds = Array.isArray(rawUploadIds)
      ? rawUploadIds.filter(Boolean)
      : rawUploadIds != null
        ? [].concat(rawUploadIds).filter(Boolean)
        : [];

    if (!uploadIds.length) return null;

    const where = {
      uploadid: { [Op.in]: uploadIds },
    };

    // Provider
    if (provider && provider !== "All") {
      const pk = CloudAccount.primaryKeyAttribute || "id";

      const rows = await CloudAccount.findAll({
        where: { providername: provider },
        attributes: [pk],
        raw: true,
      });

      if (!rows.length) return null;
      where.cloudaccountid = { [Op.in]: rows.map((r) => r[pk]) };
    }

    // Service
    if (service && service !== "All") {
      const pk = Service.primaryKeyAttribute || "serviceid";

      const rows = await Service.findAll({
        where: { servicename: service },
        attributes: [pk],
        raw: true,
      });

      if (!rows.length) return null;
      where.serviceid = { [Op.in]: rows.map((r) => r[pk]) };
    }

    // Region
    if (region && region !== "All") {
      const pk = Region.primaryKeyAttribute || "id";

      const rows = await Region.findAll({
        where: { regionname: region },
        attributes: [pk],
        raw: true,
      });

      if (!rows.length) return null;
      where.regionid = { [Op.in]: rows.map((r) => r[pk]) };
    }

    return where;
  },

  // ============================================================
  //  KPI – TOTAL SPEND
  // ============================================================

  async getTotalSpend(filters) {
    const whereClause = await this._resolveFiltersToIds(filters);
    if (!whereClause) return 0;

    whereClause.billedcost = { [Op.gt]: 0 };

    const result = await BillingUsageFact.findOne({
      where: whereClause,
      attributes: [[fn("SUM", col("billedcost")), "total"]],
      raw: true,
    });

    return Number(result?.total ?? 0);
  },

  // ============================================================
  //  BREAKDOWN (TOP N)
  // ============================================================

  async getBreakdown(filters, groupByParam) {
    const whereClause = await this._resolveFiltersToIds(filters);
    if (!whereClause) return [];

    whereClause.billedcost = { [Op.gt]: 0 };
    const config = getGroupConfig(groupByParam);

    return BillingUsageFact.findAll({
      where: whereClause,
      attributes: [
        [col(config.col), "id"],
        [fn("SUM", col("billedcost")), "value"],
      ],
      group: [col(config.col)],
      order: [[fn("SUM", col("billedcost")), "DESC"]],
      limit: 50,
      raw: true,
    });
  },

  // ============================================================
  //  TIME SERIES (CHARTS)
  // ============================================================

  async getTimeSeries(filters, groupByParam) {
    const whereClause = await this._resolveFiltersToIds(filters);
    if (!whereClause) return [];

    whereClause.billedcost = { [Op.gt]: 0 };
    const config = getGroupConfig(groupByParam);

    // PostgreSQL-safe DATE_TRUNC
    const dateExpr = literal(
      `DATE_TRUNC('day', "BillingUsageFact"."chargeperiodstart")`
    );

    return BillingUsageFact.findAll({
      where: whereClause,
      attributes: [
        [dateExpr, "date"],
        [col(config.col), "groupId"],
        [fn("SUM", col("billedcost")), "cost"],
      ],
      group: [dateExpr, col(config.col)],
      order: [[dateExpr, "ASC"]],
      raw: true,
    });
  },

  // ============================================================
  //  ID → NAME RESOLUTION
  // ============================================================

  async resolveNames(idsSet, groupByParam) {
    const config = getGroupConfig(groupByParam);
    const ids = [...idsSet].filter(Boolean);

    if (!ids.length) return {};

    const pk = config.model.primaryKeyAttribute || "id";

    const rows = await config.model.findAll({
      where: { [pk]: { [Op.in]: ids } },
      attributes: [[pk, "id"], config.nameCol],
      raw: true,
    });

    return rows.reduce((acc, r) => {
      acc[r.id] = r[config.nameCol];
      return acc;
    }, {});
  },

  // ============================================================
  //  RESOURCE-LEVEL DATA
  // ============================================================

  async getResourceData(filters) {
    const { uploadIds = [] } = filters;
    if (!uploadIds.length) return [];

    const whereClause = {
      uploadid: { [Op.in]: uploadIds },
    };

    return BillingUsageFact.findAll({
      where: whereClause,
      attributes: [
        "resourceid",
        "tags",
        "chargeperiodstart",
        [fn("SUM", col("billedcost")), "totalCost"],
        [fn("SUM", col("consumedquantity")), "totalUsage"],
      ],
      include: [
        {
          model: Resource,
          as: "resource",
          attributes: ["resourcename"],
        },
        {
          model: Service,
          as: "service",
          attributes: ["servicename"],
          ...(filters.service && filters.service !== "All"
            ? { where: { servicename: filters.service } }
            : {}),
        },
        {
          model: Region,
          as: "region",
          attributes: ["regionname"],
          ...(filters.region && filters.region !== "All"
            ? { where: { regionname: filters.region } }
            : {}),
        },
        {
          model: CloudAccount,
          as: "cloudAccount",
          attributes: ["providername"],
          ...(filters.provider && filters.provider !== "All"
            ? { where: { providername: filters.provider } }
            : {}),
        },
      ],
      group: [
        col("BillingUsageFact.resourceid"),
        col("BillingUsageFact.tags"),
        col("BillingUsageFact.chargeperiodstart"),
        col("resource.resourceid"),
        col("service.serviceid"),
        col("region.id"),
        col("cloudAccount.id"),
      ],
      raw: true,
      nest: true,
    });
  },

  // ============================================================
  //  FILTER DROPDOWNS (from billing data for selected uploads only)
  // ============================================================

  /**
   * Get filter options scoped by uploadIds – only providers/services/regions
   * that appear in BillingUsageFact for those uploads (CSV/billing data).
   * No predefined global list.
   */
  async getFilterOptionsForUploads(uploadIds = []) {
    const safeIds = Array.isArray(uploadIds)
      ? uploadIds.filter(Boolean)
      : uploadIds != null
        ? [].concat(uploadIds).filter(Boolean)
        : [];

    if (!safeIds.length) {
      return {
        providers: ["All"],
        services: ["All"],
        regions: ["All"],
        accounts: ["All"],
        subAccounts: ["All"],
        costCategories: ["All"],
        apps: ["All"],
        teams: ["All"],
        envs: ["All"],
        currencyModes: ["usd"],
        tagKeys: [],
      };
    }

    const where = { uploadid: { [Op.in]: safeIds } };

    const [accountIds, serviceIds, regionIds, subAccountsRaw, costCategoriesRaw, tagRows] =
      await Promise.all([
        BillingUsageFact.findAll({
          where,
          attributes: [[fn("DISTINCT", col("cloudaccountid")), "id"]],
          raw: true,
        }),
        BillingUsageFact.findAll({
          where,
          attributes: [[fn("DISTINCT", col("serviceid")), "id"]],
          raw: true,
        }),
        BillingUsageFact.findAll({
          where,
          attributes: [[fn("DISTINCT", col("regionid")), "id"]],
          raw: true,
        }),
        BillingUsageFact.findAll({
          where,
          attributes: [[fn("DISTINCT", col("subaccountid")), "value"]],
          raw: true,
        }),
        BillingUsageFact.findAll({
          where,
          attributes: [[fn("DISTINCT", col("chargecategory")), "value"]],
          raw: true,
        }),
        BillingUsageFact.findAll({
          where,
          attributes: ["tags"],
          limit: 2000,
          raw: true,
        }),
      ]);

    const aIds = accountIds.map((r) => r.id).filter(Boolean);
    const sIds = serviceIds.map((r) => r.id).filter(Boolean);
    const rIds = regionIds.map((r) => r.id).filter(Boolean);

    const [providerRows, serviceRows, regionRows, accountRows] = await Promise.all([
      aIds.length
        ? CloudAccount.findAll({
            where: { id: { [Op.in]: aIds } },
            attributes: ["providername"],
            raw: true,
          })
        : [],
      sIds.length
        ? Service.findAll({
            where: { serviceid: { [Op.in]: sIds } },
            attributes: ["servicename"],
            raw: true,
          })
        : [],
      rIds.length
        ? Region.findAll({
            where: { id: { [Op.in]: rIds } },
            attributes: ["regionname"],
            raw: true,
          })
        : [],
      aIds.length
        ? CloudAccount.findAll({
            where: { id: { [Op.in]: aIds } },
            attributes: ["billingaccountname", "billingaccountid"],
            raw: true,
          })
        : [],
    ]);

    const toValues = (rows, key) =>
      ["All", ...new Set(rows.map((r) => r[key]).filter(Boolean))].sort();

    const appSet = new Set();
    const teamSet = new Set();
    const envSet = new Set();
    const tagKeySet = new Set();

    const readTag = (tags, keys = []) => {
      if (!tags || typeof tags !== "object") return null;
      const lower = Object.keys(tags).reduce((acc, key) => {
        acc[String(key).toLowerCase()] = tags[key];
        return acc;
      }, {});
      for (const key of keys) {
        const value = lower[String(key).toLowerCase()];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          return String(value).trim();
        }
      }
      return null;
    };

    tagRows.forEach((row) => {
      const tags = row?.tags && typeof row.tags === "object" ? row.tags : {};
      Object.keys(tags).forEach((key) => tagKeySet.add(String(key)));
      const app = readTag(tags, ["app", "application", "service"]);
      const team = readTag(tags, ["team", "owner", "squad", "business_unit"]);
      const env = readTag(tags, ["env", "environment", "stage"]);
      if (app) appSet.add(app);
      if (team) teamSet.add(team);
      if (env) envSet.add(env);
    });

    const accountValues = [
      "All",
      ...new Set(
        accountRows
          .map((row) => row.billingaccountname || row.billingaccountid)
          .filter(Boolean)
      ),
    ].sort();

    return {
      providers: toValues(providerRows, "providername"),
      services: toValues(serviceRows, "servicename"),
      regions: toValues(regionRows, "regionname"),
      accounts: accountValues,
      subAccounts: ["All", ...new Set(subAccountsRaw.map((row) => row.value).filter(Boolean))].sort(),
      costCategories: ["All", ...new Set(costCategoriesRaw.map((row) => row.value).filter(Boolean))].sort(),
      apps: ["All", ...[...appSet].sort()],
      teams: ["All", ...[...teamSet].sort()],
      envs: ["All", ...[...envSet].sort()],
      currencyModes: ["usd"],
      tagKeys: [...tagKeySet].sort(),
    };
  },

  /**
   * Legacy: returns filter options. Prefer getFilterOptionsForUploads(uploadIds).
   */
  async getFilterOptions() {
    return this.getFilterOptionsForUploads([]);
  },
};
