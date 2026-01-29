import { normalize } from "./normalize.js";

/* ===============================
   ALIASES WITH WEIGHTS
================================ */
export const ALIASES = {
  // ───────── Provider / Account ─────────
  providername: [
    { key: "provider", weight: 0.9 },
    { key: "cloudprovider", weight: 0.9 },
    { key: "vendor", weight: 0.7 },
    { key: "vendorname", weight: 0.8 },
  ],

  billingaccountid: [
    { key: "billingaccountid", weight: 1.0 },
    { key: "billingaccount", weight: 0.8 },
    { key: "payeraccountid", weight: 0.9 },
    { key: "payer_account_id", weight: 0.9 }, // AWS
    { key: "billingid", weight: 0.6 },
    { key: "masteraccountid", weight: 0.8 },
  ],

  billingaccountname: [
    { key: "billingaccountname", weight: 1.0 },
    { key: "payeraccountname", weight: 0.9 },
    { key: "accountname", weight: 0.6 },
  ],

  billingcurrency: [
    { key: "billingcurrency", weight: 1.0 },
    { key: "bill_billing_currency", weight: 1.0 }, // AWS
    { key: "currency", weight: 0.6 },
    { key: "invoicecurrency", weight: 0.9 },
  ],

  // ───────── Service / Product ─────────
  servicecategory: [
    { key: "servicecategory", weight: 1.0 },
    { key: "productcategory", weight: 0.8 },
    { key: "metercategory", weight: 0.7 },
  ],

  servicename: [
    { key: "servicename", weight: 1.0 },
    { key: "service", weight: 0.7 },
    { key: "productname", weight: 0.7 },
    { key: "product_product_name", weight: 0.9 }, // AWS
    { key: "service.description", weight: 0.9 },  // GCP
    { key: "metername", weight: 0.8 },
  ],

  // ───────── Region / Location ─────────
  regionname: [
    { key: "regionname", weight: 1.0 },
    { key: "region", weight: 0.6 },
    { key: "location", weight: 0.8 },
    { key: "resourcelocation", weight: 0.9 }, // Azure
    { key: "product_region", weight: 0.9 },   // AWS
    { key: "location.region", weight: 0.9 },  // GCP
  ],

  // ───────── Sub Account ─────────
  subaccountid: [
    { key: "subscriptionid", weight: 1.0 }, // Azure
    { key: "project.id", weight: 0.9 },     // GCP
    { key: "line_item_usage_account_id", weight: 0.9 }, // AWS
    { key: "subaccountid", weight: 1.0 },
  ],

  sub_account_name: [
    { key: "subscriptionname", weight: 1.0 },
    { key: "project.name", weight: 0.9 },
    { key: "subaccountname", weight: 1.0 },
  ],

  // ───────── Usage / Cost ─────────
  consumedquantity: [
    { key: "quantity", weight: 0.8 },
    { key: "usagequantity", weight: 1.0 },
    { key: "usageamount", weight: 0.9 },
    { key: "line_item_usage_amount", weight: 1.0 }, // AWS
  ],

  listunitprice: [
    { key: "unitprice", weight: 1.0 },
    { key: "ondemandprice", weight: 0.8 },
    { key: "pricing_public_on_demand_rate", weight: 0.9 }, // AWS
  ],

  billedcost: [
    { key: "costinbillingcurrency", weight: 1.0 },
    { key: "pretaxcost", weight: 0.9 },
    { key: "totalcost", weight: 0.8 },
    { key: "line_item_unblended_cost", weight: 1.0 }, // AWS
    { key: "cost", weight: 0.5 }, // weak
  ],

  regioncode : [{ key : "regionid" , weight : 1.0}],

  id : [ { key : "linkedaccount" , weight : 1.0}]
};

/* ===============================
   Alias Scoring
================================ */
export function aliasScore(csvCol, internalField) {
  const col = normalize(csvCol);
  const aliases = ALIASES[internalField] || [];

  let bestScore = 0;

  for (const a of aliases) {
    const alias = normalize(a.key);

    // exact match
    if (alias === col) {
      bestScore = Math.max(bestScore, a.weight);
    }

    // contains match (AWS/GCP style)
    else if (col.includes(alias) || alias.includes(col)) {
      bestScore = Math.max(bestScore, a.weight * 0.85);
    }
  }

  return bestScore;
}
