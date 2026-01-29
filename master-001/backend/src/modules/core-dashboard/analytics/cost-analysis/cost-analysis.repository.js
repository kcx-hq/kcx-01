import {
  BillingUsageFact,
  CloudAccount,
  Service,
  Region,
  Resource,
} from "../../../../models/index.js";
import { Op } from "sequelize";
import sequelize from "../../../../config/db.config.js";

const Sequelize = sequelize;

/**
 * Grouping configuration
 */
const getGroupConfig = (groupByParam) => {
  switch (groupByParam) {
    case "RegionName":
      return { col: "regionid", model: Region, nameCol: "regionname" };

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
  //  SECTION 1: DASHBOARD AGGREGATION METHODS (NO JOINS)
  // ============================================================

  /**
   * Resolve frontend filters (names) → IDs
   * uploadIds is REQUIRED for data isolation
   */
  async _resolveFiltersToIds(filters = {}) {
    const where = {};
    const { provider, service, region, uploadIds = [] } = filters;

    // 0. Upload isolation (MANDATORY)
    if (uploadIds.length > 0) {
      where.uploadid = { [Op.in]: uploadIds };
    } else {
      // No uploads → no data
      return null;
    }

    // 1. Provider
    if (provider && provider !== "All") {
      const pk = CloudAccount.primaryKeyAttribute || "id";

      const accs = await CloudAccount.findAll({
        where: { providername: provider },
        attributes: [pk],
        raw: true,
      });

      if (!accs.length) return null;

      where.cloudaccountid = {
        [Op.in]: accs.map((a) => a[pk]),
      };
    }

    // 2. Service (multi-provider safe)
    if (service && service !== "All") {
      const pk = "serviceid";

      const services = await Service.findAll({
        where: { servicename: service },
        attributes: [pk],
        raw: true,
      });

      if (!services.length) return null;

      where.serviceid = {
        [Op.in]: services.map((s) => s[pk]),
      };
    }

    // 3. Region
    if (region && region !== "All") {
      const pk = Region.primaryKeyAttribute || "id";

      const regions = await Region.findAll({
        where: { regionname: region },
        attributes: [pk],
        raw: true,
      });

      if (!regions.length) return null;

      where.regionid = {
        [Op.in]: regions.map((r) => r[pk]),
      };
    }

    return where;
  },

  /**
   * KPI – Total Spend
   */
  async getTotalSpend(filters) {
    const whereClause = await this._resolveFiltersToIds(filters);
    if (!whereClause) return 0;

    whereClause.billedcost = { [Op.gt]: 0 };

    const result = await BillingUsageFact.findOne({
      where: whereClause,
      attributes: [[Sequelize.fn("SUM", Sequelize.col("billedcost")), "total"]],
      raw: true,
    });

    return Number(result?.total || 0);
  },

  /**
   * Breakdown (Top N)
   */
  async getBreakdown(filters, groupByParam) {
    const whereClause = await this._resolveFiltersToIds(filters);
    if (!whereClause) return [];

    whereClause.billedcost = { [Op.gt]: 0 };
    const config = getGroupConfig(groupByParam);

    return BillingUsageFact.findAll({
      where: whereClause,
      attributes: [
        [Sequelize.col(config.col), "id"],
        [Sequelize.fn("SUM", Sequelize.col("billedcost")), "value"],
      ],
      group: [config.col],
      order: [[Sequelize.fn("SUM", Sequelize.col("billedcost")), "DESC"]],
      limit: 50,
      raw: true,
    });
  },

  /**
   * Time Series (Charts)
   */
  async getTimeSeries(filters, groupByParam) {
    const whereClause = await this._resolveFiltersToIds(filters);
    if (!whereClause) return [];

    whereClause.billedcost = { [Op.gt]: 0 };
    const config = getGroupConfig(groupByParam);

    const dateAttr = Sequelize.fn(
      "DATE_TRUNC",
      "day",
      Sequelize.col("chargeperiodstart")
    );

    return BillingUsageFact.findAll({
      where: whereClause,
      attributes: [
        [dateAttr, "date"],
        [Sequelize.col(config.col), "groupId"],
        [Sequelize.fn("SUM", Sequelize.col("billedcost")), "cost"],
      ],
      group: [dateAttr, config.col],
      order: [[dateAttr, "ASC"]],
      raw: true,
    });
  },

  /**
   * Resolve IDs → Names
   */
  async resolveNames(idsSet, groupByParam) {
    const config = getGroupConfig(groupByParam);
    const ids = Array.from(idsSet).filter(Boolean);
    const nameMap = {};

    if (!ids.length) return nameMap;

    const pk = config.model.primaryKeyAttribute || "id";

    const rows = await config.model.findAll({
      where: { [pk]: { [Op.in]: ids } },
      attributes: [[pk, "id"], config.nameCol],
      raw: true,
    });

    rows.forEach((r) => {
      nameMap[r.id] = r[config.nameCol];
    });

    return nameMap;
  },

  /**
   * Resource-level data
   */
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
        [Sequelize.fn("SUM", Sequelize.col("billedcost")), "totalCost"],
        [
          Sequelize.fn("SUM", Sequelize.col("consumedquantity")),
          "totalUsage",
        ],
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
          where:
            filters.service && filters.service !== "All"
              ? { servicename: filters.service }
              : undefined,
        },
        {
          model: Region,
          as: "region",
          attributes: ["regionname"],
          where:
            filters.region && filters.region !== "All"
              ? { regionname: filters.region }
              : undefined,
        },
        {
          model: CloudAccount,
          as: "cloudAccount",
          attributes: ["providername"],
          where:
            filters.provider && filters.provider !== "All"
              ? { providername: filters.provider }
              : undefined,
        },
      ],
      group: [
        "BillingUsageFact.resourceid",
        "BillingUsageFact.tags",
        "BillingUsageFact.chargeperiodstart",
        "resource.resourceid",
        "service.serviceid",
        "region.id",
        "cloudAccount.id",
      ],
      raw: true,
      nest: true,
    });
  },

  // ============================================================
  //  SECTION 2: FILTER DROPDOWNS
  // ============================================================

  async getFilterOptions() {
    const [providers, services, regions] = await Promise.all([
      CloudAccount.findAll({
        attributes: [
          [Sequelize.fn("DISTINCT", Sequelize.col("providername")), "value"],
        ],
        raw: true,
      }),
      Service.findAll({
        attributes: [
          [Sequelize.fn("DISTINCT", Sequelize.col("servicename")), "value"],
        ],
        raw: true,
      }),
      Region.findAll({
        attributes: [
          [Sequelize.fn("DISTINCT", Sequelize.col("regionname")), "value"],
        ],
        raw: true,
      }),
    ]);

    const normalize = (arr) =>
      ["All", ...new Set(arr.map((i) => i.value).filter(Boolean))].sort();

    return {
      providers: normalize(providers),
      services: normalize(services),
      regions: normalize(regions),
    };
  },
};
