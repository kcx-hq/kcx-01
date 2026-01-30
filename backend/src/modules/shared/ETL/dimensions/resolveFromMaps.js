import { clean } from "../../../../utils/sanitize.js";

export function resolveDimensionIdsFromMaps(row, maps) {
  const provider = clean(row.providername)?.toLowerCase();

  return {
    cloudaccountid:
      provider && row.billingaccountid
        ? maps.cloudAccounts.get(
            `${provider}:${clean(row.billingaccountid)}`
          ) || null
        : null,

    serviceid:
      provider && row.servicename
        ? maps.services.get(
            `${provider}:${clean(row.servicename)}`
          ) || null
        : null,

    regionid:
      provider && row.regioncode
        ? maps.regions.get(
            `${provider}:${clean(row.regioncode)}`
          ) || null
        : null,

    skuid:
      row.skuid ? maps.skus.get(clean(row.skuid)) || null : null,

    resourceid:
      row.resourceid
        ? maps.resources.get(clean(row.resourceid)) || null
        : null,

    subaccountid:
      row.subaccountid
        ? maps.subAccounts.get(clean(row.subaccountid)) || null
        : null,

    commitmentdiscountid:
      row.commitmentdiscountid
        ? maps.commitmentDiscounts.get(
            clean(row.commitmentdiscountid)
          ) || null
        : null,
  };
}
