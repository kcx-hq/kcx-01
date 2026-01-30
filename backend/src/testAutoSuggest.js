import fs from "fs";
import csv from "csv-parser";
import { autoSuggest } from "./utils/mapping/autoSuggest.js";

async function runTest() {
  const headers = [];
  const rows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream("sample_billing.csv")
      .pipe(csv())
      .on("headers", h => headers.push(...h))
      .on("data", row => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  const internalFields = [
    "providername",
    "billingaccountid",
    "billingaccountname",
    "billingcurrency",
    "invoiceissuername",
    "publishername",
    "servicecategory",
    "servicename",
    "regioncode",
    "regionname",
    "availabilityzone",
    "skuid",
    "skupriceid",
    "pricingcategory",
    "resourceid",
    "resourcename",
    "resourcetype",
    "subaccountid",
    "sub_account_name",
    "commitmentdiscountid",
    "commitmentdiscountname",
    "commitmentdiscountcategory",
    "commitmentdiscounttype",
    "commitmentdiscountstatus",
    "chargecategory",
    "chargeclass",
    "chargedescription",
    "chargefrequency",
    "billingperiodstart",
    "billingperiodend",
    "chargeperiodstart",
    "chargeperiodend",
    "consumedquantity",
    "consumedunit",
    "pricingquantity",
    "listunitprice",
    "contractedunitprice",
    "listcost",
    "contractedcost",
    "effectivecost",
    "billedcost",
    "tags",
  ];

  const suggestions = autoSuggest(headers, rows, internalFields);

  console.log(JSON.stringify(suggestions, null, 2));
}

runTest();
