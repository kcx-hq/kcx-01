import { clean } from "../../../../utils/sanitize.js";

export function createDimensionsAccumulator() {
  return {
    cloudAccounts: new Map(),
    services: new Map(),
    regions: new Map(),
    skus: new Map(),
    resources: new Map(),
    subAccounts: new Map(),
    commitmentDiscounts: new Map(),
  };
}

export function collectDimensionRow(mappedRow, dims) {
  if (!mappedRow) {
    return;
  }

  const provider = clean(mappedRow.providername)?.toLowerCase();
  if (!provider) {
    return;
  }

  const billingAccountId = clean(mappedRow.billingaccountid);
  if (billingAccountId) {
    const key = `${provider}:${billingAccountId}`;
    if (!dims.cloudAccounts.has(key)) {
      dims.cloudAccounts.set(key, {
        providername: provider,
        billingaccountid: billingAccountId,
        billingaccountname: clean(mappedRow.billingaccountname),
        billingcurrency: clean(mappedRow.billingcurrency),
        invoiceissuername: clean(mappedRow.invoiceissuername),
        publishername: clean(mappedRow.publishername),
      });
    }
  }

  const serviceName = clean(mappedRow.servicename);
  if (serviceName) {
    const key = `${provider}:${serviceName}`;
    if (!dims.services.has(key)) {
      dims.services.set(key, {
        providername: provider,
        servicename: serviceName,
        servicecategory: clean(mappedRow.servicecategory),
      });
    }
  }

  const regionCode = clean(mappedRow.regioncode);
  if (regionCode) {
    const key = `${provider}:${regionCode}`;
    if (!dims.regions.has(key)) {
      dims.regions.set(key, {
        providername: provider,
        regioncode: regionCode,
        regionname: clean(mappedRow.regionname),
        availabilityzone: clean(mappedRow.availabilityzone),
      });
    }
  }

  const skuId = clean(mappedRow.skuid);
  if (skuId && !dims.skus.has(skuId)) {
    dims.skus.set(skuId, {
      skuid: skuId,
      skupriceid: clean(mappedRow.skupriceid),
      pricingcategory: clean(mappedRow.pricingcategory),
      pricingunit: clean(mappedRow.pricingunit),
    });
  }

  const resourceId = clean(mappedRow.resourceid);
  if (resourceId && !dims.resources.has(resourceId)) {
    dims.resources.set(resourceId, {
      resourceid: resourceId,
      resourcename: clean(mappedRow.resourcename),
      resourcetype: clean(mappedRow.resourcetype),
    });
  }

  const subAccountId = clean(mappedRow.subaccountid);
  if (subAccountId && !dims.subAccounts.has(subAccountId)) {
    dims.subAccounts.set(subAccountId, {
      subaccountid: subAccountId,
      subaccountname: clean(mappedRow.subaccountname),
    });
  }

  const discountId = clean(mappedRow.commitmentdiscountid);
  if (discountId && !dims.commitmentDiscounts.has(discountId)) {
    dims.commitmentDiscounts.set(discountId, {
      commitmentdiscountid: discountId,
      commitmentdiscountname: clean(mappedRow.commitmentdiscountname),
      commitmentdiscountcategory: clean(mappedRow.commitmentdiscountcategory),
      commitmentdiscounttype: clean(mappedRow.commitmentdiscounttype),
      commitmentdiscountstatus: clean(mappedRow.commitmentdiscountstatus),
    });
  }
}

export async function collectDimensions(mappedRows) {
  const dims = createDimensionsAccumulator();
  for (const row of mappedRows) {
    collectDimensionRow(row, dims);
  }
  return dims;
}
