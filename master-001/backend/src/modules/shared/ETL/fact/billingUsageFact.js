import {BillingUsageFact} from "../../../../models/index.js";
import { toNumber, toDate, toText , safeParseJSON } from "../../../../utils/sanitize.js";


const BATCH_SIZE = 500;
let buffer = [];

export async function pushFact(uploadId, row, dims) {
  buffer.push({
    uploadid: uploadId,

    cloudaccountid: dims.cloudaccountid,
    serviceid: dims.serviceid,
    skuid: dims.skuid,
    resourceid: dims.resourceid,
    regionid: dims.regionid,
    subaccountid: dims.subaccountid,
    commitmentdiscountid: dims.commitmentdiscountid,

    chargecategory: toText(row.chargecategory),
    chargeclass: toText(row.chargeclass),
    chargedescription: toText(row.chargedescription),
    chargefrequency: toText(row.chargefrequency),

    consumedquantity: toNumber(row.consumedquantity),
    consumedunit: toText(row.consumedunit),

    pricingquantity: toNumber(row.pricingquantity),
    pricingunit: toText(row.pricingunit),

    listunitprice: toNumber(row.listunitprice),
    contractedunitprice: toNumber(row.contractedunitprice),

    listcost: toNumber(row.listcost),
    contractedcost: toNumber(row.contractedcost),
    effectivecost: toNumber(row.effectivecost),
    billedcost: toNumber(row.billedcost),

    billingperiodstart: toDate(row.billingperiodstart),
    billingperiodend: toDate(row.billingperiodend),
    chargeperiodstart: toDate(row.chargeperiodstart),
    chargeperiodend: toDate(row.chargeperiodend),

    tags: safeParseJSON(row.tags),
    createdat: new Date(),
  });

  if (buffer.length >= BATCH_SIZE) {
    await flushFacts();
  }
}


export async function flushFacts() {
  if (!buffer.length) return;

  const data = buffer;
  buffer = [];

 try{
   await BillingUsageFact.bulkCreate(data, {
    ignoreDuplicates: true,
    validate: false,
    logging: false,
   
  });

 }catch(err){
   console.error("Error bulk creating billing usage facts:", err.message);
 }
}
