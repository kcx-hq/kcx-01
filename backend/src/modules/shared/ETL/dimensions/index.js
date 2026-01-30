// import { resolveCloudAccount } from "./cloudAccount.dim.js";
// import { resolveRegion } from "./region.dim.js";
// import { resolveService } from "./service.dim.js";
// import { resolveSku } from "./sku.dim.js";
// import { resolveResource } from "./resource.dim.js";
// import { resolveSubAccount } from "./subAccount.dim.js";
// import { resolveCommitmentDiscount } from "./commitmentDiscount.dim.js";

// export async function resolveDimensions(row) {
//   return {
//     cloudaccountid: await resolveCloudAccount(row),
//     regionid: await resolveRegion(row),
//     serviceid: await resolveService(row),
//     skuid: await resolveSku(row),
//     resourceid: await resolveResource(row),
//     subaccountid: await resolveSubAccount(row),
//     commitmentdiscountid: await resolveCommitmentDiscount(row),
//   };
// }

import {
  CloudAccount,
  Service,
  Region,
  Sku,
  Resource,
  SubAccount,
  CommitmentDiscount,
} from "../../../models/index.js";

export async function resolveDimensionIds(row) {
  const cloud = row.ProviderName && row.BillingAccountId
    ? await CloudAccount.findOne({
        where: {
          providername: row.ProviderName,
          billingaccountid: row.BillingAccountId,
        },
      })
    : null;

  return {
    cloudaccountid: cloud?.id || null,
    serviceid: row.ServiceName
      ? (await Service.findOne({ where: { servicename: row.ServiceName } }))?.serviceid
      : null,
    regionid: row.RegionId || null,
    skuid: row.SkuId || null,
    resourceid: row.ResourceId || null,
    subaccountid: row.SubAccountId || null,
    commitmentdiscountid: row.CommitmentDiscountId || null,
  };
}
