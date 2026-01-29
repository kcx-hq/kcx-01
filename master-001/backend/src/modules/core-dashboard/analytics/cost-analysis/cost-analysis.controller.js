import { Op, Sequelize } from "sequelize";
import {
  BillingUsageFact,
  Resource,
  Service,
  Region,
  CloudAccount,
} from "../../../../models/index.js";

import {
  generateCostAnalysis,
  getFilterDropdowns,
} from "./cost-analysis.service.js";

// Whitelist allowed grouping columns for security
const ALLOWED_GROUPS = ["ServiceName", "RegionName", "ProviderName"];

/**
 * Normalize uploadIds from body or query
 */
function extractUploadIds(req) {
  const bodyValue = req.body?.uploadIds || req.body?.uploadId;
  const queryValue = req.query?.uploadIds || req.query?.uploadId;

  const source = bodyValue ?? queryValue;
  if (!source) return [];

  if (Array.isArray(source)) return source;

  if (typeof source === "string") {
    return source
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  return [source];
}

export const getCostAnalysis = async (req, res) => {
  try {
    // 1. UploadIds (BODY first, QUERY fallback)
    const uploadIds = extractUploadIds(req);

    // 2. Filters
    const filters = {
      provider: req.body?.provider || req.query?.provider || "All",
      service: req.body?.service || req.query?.service || "All",
      region: req.body?.region || req.query?.region || "All",
    };

    // 3. GroupBy (secured)
    let groupBy = req.body?.groupBy || req.query?.groupBy || "ServiceName";
    if (!ALLOWED_GROUPS.includes(groupBy)) {
      groupBy = "ServiceName";
    }

    // 4. Call Service
    const data = await generateCostAnalysis(
      {
        filters,
        uploadIds,
      },
      groupBy,
    );

    res.json(data);
  } catch (error) {
    console.error("Cost Analysis Error:", error);
    res.status(500).json({
      error: "Failed to generate cost analysis",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getFilterOptions = async (req, res) => {
  try {
    const options = await getFilterDropdowns();
    res.json(options);
  } catch (error) {
    console.error("Filter Error:", error);
    res.status(500).json({ error: "Failed to load filters" });
  }
};

// export const getCostDataWithResources = async (options = {}) => {
//   const {
//     filters = {},
//     startDate = null,
//     endDate = null,
//     uploadIds = [],
//   } = options;

//   // Build where clause
//   const whereClause = {};

//   // UploadId filter (from request)
//   if (uploadIds.length > 0) {
//     whereClause.uploadid = { [Op.in]: uploadIds };
//   }

//   // Date range filter
//   if (startDate || endDate) {
//     whereClause.chargeperiodstart = {};
//     if (startDate) whereClause.chargeperiodstart[Op.gte] = startDate;
//     if (endDate) whereClause.chargeperiodstart[Op.lte] = endDate;
//   }

//   const include = [];

//   // Resource
//   include.push({
//     model: Resource,
//     as: "resource",
//     required: false,
//     attributes: ["resourcename", "resourcetype"],
//   });

//   // Service
//   include.push({
//     model: Service,
//     as: "service",
//     required: filters.service && filters.service !== "All",
//     where:
//       filters.service && filters.service !== "All"
//         ? { servicename: filters.service }
//         : undefined,
//     attributes: ["servicename"],
//   });

//   // Region
//   include.push({
//     model: Region,
//     as: "region",
//     required: filters.region && filters.region !== "All",
//     where:
//       filters.region && filters.region !== "All"
//         ? { regionname: filters.region }
//         : undefined,
//     attributes: ["regionname"],
//   });

//   // CloudAccount (case-insensitive provider filter)
//   include.push({
//     model: CloudAccount,
//     as: "cloudAccount",
//     required: filters.provider && filters.provider !== "All",
//     where:
//       filters.provider && filters.provider !== "All"
//         ? Sequelize.where(
//             Sequelize.fn("LOWER", Sequelize.col("cloudAccount.providername")),
//             filters.provider.toLowerCase(),
//           )
//         : undefined,
//     attributes: [
//       "id",
//       "providername",
//       "billingaccountid",
//       "billingaccountname",
//     ],
//   });

//   const facts = await BillingUsageFact.findAll({
//     where: whereClause,
//     include,
//     attributes: [
//       "id",
//       "resourceid",
//       "billedcost",
//       "chargeperiodstart",
//       "tags",
//       "chargedescription",
//       "consumedquantity",
//       "chargecategory",
//       "chargeclass",
//     ],
//     raw: false,
//   });

//   return facts.map((fact) => {
//     const row = fact.toJSON();
//     return {
//       id: row.id,
//       resourceid: row.resourceid,
//       billedcost: row.billedcost,
//       chargeperiodstart: row.chargeperiodstart,
//       tags: row.tags || {},
//       usagetype: row.chargecategory || null,
//       operation: row.chargeclass || row.chargedescription || null,
//       chargedescription: row.chargedescription || null,
//       consumedquantity: row.consumedquantity || null,
//       resource: row.resource
//         ? {
//             resourcename: row.resource.resourcename,
//             resourcetype: row.resource.resourcetype,
//           }
//         : null,
//       service: row.service ? { servicename: row.service.servicename } : null,
//       region: row.region ? { regionname: row.region.regionname } : null,
//       cloudAccount: row.cloudAccount
//         ? {
//             id: row.cloudAccount.id,
//             providername: row.cloudAccount.providername,
//             billingaccountid: row.cloudAccount.billingaccountid,
//             billingaccountname: row.cloudAccount.billingaccountname,
//           }
//         : null,
//     };
//   });
// };
