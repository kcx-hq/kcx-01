import { BillingUsageFact, Service, Region, CloudAccount } from "../../../models/index.js";
import Sequelize from "../../../config/db.config.js";
import { Op } from "sequelize";



export const unitEconomicsRepository = {
  async getFacts({ filters = {}, startDate, endDate, uploadIds }) {
    if (!uploadIds?.length) return [];

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
        "consumedquantity",
        "consumedunit",
        "effectivecost",
        "billedcost",
        "listunitprice",
        "contractedunitprice",
        "skuid",
        "commitmentdiscountid"
      ],
      order: [["chargeperiodstart", "ASC"]],
      raw: true
    });
  }
};
