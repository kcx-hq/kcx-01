
import { clean  } from "../../../../utils/sanitize.js";


export async function collectDimensions(mappedRows) {
  const dims = {
    cloudAccounts: new Map(),
    services: new Map(),
    regions: new Map(),
    skus: new Map(),
    resources: new Map(),
    subAccounts: new Map(),
    commitmentDiscounts: new Map(),
  };

  for (const r of mappedRows) {

    /* ======================
       Provider (REQUIRED)
    ====================== */
    const provider = clean(r.providername)?.toLowerCase();
    if (!provider) continue;

    /* ======================
       Cloud Account
    ====================== */
    const billingAccountId = clean(r.billingaccountid);
    if (billingAccountId) {
      const key = `${provider}:${billingAccountId}`;
      if (!dims.cloudAccounts.has(key)) {
        dims.cloudAccounts.set(key, {
          providername: provider,
          billingaccountid: billingAccountId,
          billingaccountname: clean(r.billingaccountname),
          billingcurrency: clean(r.billingcurrency),
          invoiceissuername: clean(r.invoiceissuername),
          publishername: clean(r.publishername),
        });
      }
    }

    /* ======================
       Service
    ====================== */
    const serviceName = clean(r.servicename);
    if (serviceName) {
      const key = `${provider}:${serviceName}`;
      if (!dims.services.has(key)) {
        dims.services.set(key, {
          providername: provider,
          servicename: serviceName,
          servicecategory: clean(r.servicecategory),
        });
      }
    }

    /* ======================
       Region
    ====================== */
    const regionId = clean(r.regioncode);
    if (regionId) {
      const key = `${provider}:${regionId}`;
      if (!dims.regions.has(key)) {
        dims.regions.set(key, {
          providername: provider,
          regioncode: clean(r.regioncode),
          regionname: clean(r.regionname),
          availabilityzone: clean(r.availabilityzone),
        });
      }
    }

    /* ======================
       SKU (global)
    ====================== */
    const skuId = clean(r.skuid);
    if (skuId && !dims.skus.has(skuId)) {
      dims.skus.set(skuId, {
        skuid: skuId,
        skupriceid: clean(r.skupriceid),
        pricingcategory: clean(r.pricingcategory),
        pricingunit: clean(r.pricingunit),
      });
    }

    /* ======================
       Resource (global)
    ====================== */
    const resourceId = clean(r.resourceid);
    if (resourceId && !dims.resources.has(resourceId)) {
      dims.resources.set(resourceId, {
        resourceid: resourceId,
        resourcename: clean(r.resourcename),
        resourcetype: clean(r.resourcetype),
      });
    }

    /* ======================
       Sub Account
    ====================== */
    const subAccountId = clean(r.subaccountid);
    if (subAccountId && !dims.subAccounts.has(subAccountId)) {
      dims.subAccounts.set(subAccountId, {
        subaccountid: subAccountId,
        subaccountname: clean(r.subaccountname),
      });
    }

    /* ======================
       Commitment Discount
    ====================== */
    const discountId = clean(r.commitmentdiscountid);
    if (discountId && !dims.commitmentDiscounts.has(discountId)) {
      dims.commitmentDiscounts.set(discountId, {
        commitmentdiscountid: discountId,
        commitmentdiscountname: clean(r.commitmentdiscountname),
        commitmentdiscountcategory: clean(r.commitmentdiscountcategory),
        commitmentdiscounttype: clean(r.commitmentdiscounttype),
        commitmentdiscountstatus: clean(r.commitmentdiscountstatus),
      });
    }
  }

  return dims;
}
