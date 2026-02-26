import { BillingUsageFact, Service, Region, CloudAccount } from "../../../models/index.js";
import Sequelize from "../../../config/db.config.js";
import { Op } from "sequelize";



export const unitEconomicsRepository = {
  async getLatestChargePeriodStart({ filters = {}, uploadIds }) {
    if (!uploadIds?.length) return null;

    const provider = String(filters.provider || "All");
    const service = String(filters.service || "All");
    const region = String(filters.region || "All");

    const where = {
      uploadid: { [Op.in]: uploadIds },
    };

    const maxDate = await BillingUsageFact.max("chargeperiodstart", {
      where,
      include: [
        {
          model: CloudAccount,
          as: "cloudAccount",
          required: provider !== "All",
          attributes: [],
          ...(provider !== "All" ? { where: { providername: provider } } : {}),
        },
        {
          model: Service,
          as: "service",
          required: service !== "All",
          attributes: [],
          ...(service !== "All" ? { where: { servicename: service } } : {}),
        },
        {
          model: Region,
          as: "region",
          required: region !== "All",
          attributes: [],
          ...(region !== "All" ? { where: { regionname: region } } : {}),
        },
      ],
      raw: true,
    });

    return maxDate || null;
  },

  async getFacts({ filters = {}, startDate, endDate, uploadIds }) {
    if (!uploadIds?.length) return [];
    const provider = String(filters.provider || "All");
    const service = String(filters.service || "All");
    const region = String(filters.region || "All");

    const where = {
      uploadid: { [Op.in]: uploadIds },
    };

    if (startDate || endDate) {
      where.chargeperiodstart = {};
      if (startDate) where.chargeperiodstart[Op.gte] = startDate;
      if (endDate) where.chargeperiodstart[Op.lte] = endDate;
    }

    return BillingUsageFact.findAll({
      where,
      attributes: [
        "chargeperiodstart",
        "chargecategory",
        "consumedquantity",
        "consumedunit",
        "effectivecost",
        "billedcost",
        "contractedcost",
        "tags",
        "listunitprice",
        "contractedunitprice",
        "skuid",
        "commitmentdiscountid"
      ],
      include: [
        {
          model: CloudAccount,
          as: "cloudAccount",
          required: provider !== "All",
          attributes: [],
          ...(provider !== "All" ? { where: { providername: provider } } : {}),
        },
        {
          model: Service,
          as: "service",
          required: service !== "All",
          attributes: [],
          ...(service !== "All" ? { where: { servicename: service } } : {}),
        },
        {
          model: Region,
          as: "region",
          required: region !== "All",
          attributes: [],
          ...(region !== "All" ? { where: { regionname: region } } : {}),
        },
      ],
      order: [["chargeperiodstart", "ASC"]],
      raw: true
    });
  }
};
