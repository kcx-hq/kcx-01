import {
  CloudAccount,
  Service,
  Region,
  Sku,
  Resource,
  SubAccount,
  CommitmentDiscount,
} from "../../../../models/index.js";

export async function preloadDimensionMaps() {
  const maps = {
    cloudAccounts: new Map(),
    services: new Map(),
    regions: new Map(),
    skus: new Map(),
    resources: new Map(),
    subAccounts: new Map(),
    commitmentDiscounts: new Map(),
  };

  // 🔹 Cloud Accounts (provider + billingAccountId)
  for (const c of await CloudAccount.findAll()) {
    const key = `${c.providername}:${c.billingaccountid}`;
    maps.cloudAccounts.set(key, c.id);
  }

  // 🔹 Services (provider + servicename)
  for (const s of await Service.findAll()) {
    const key = `${s.providername}:${s.servicename}`;
    maps.services.set(key, s.serviceid);
  }

  // 🔹 Regions (provider + regionid)
  for (const r of await Region.findAll()) {
    const key = `${r.providername}:${r.regioncode}`;
    maps.regions.set(key, r.id); // ✅ SURROGATE KEY
  }

  // 🔹 SKU
  for (const s of await Sku.findAll()) {
    maps.skus.set(s.skuid, s.skuid);
  }

  // 🔹 Resource
  for (const r of await Resource.findAll()) {
    maps.resources.set(r.resourceid, r.resourceid);
  }

  // 🔹 Sub Account
  for (const s of await SubAccount.findAll()) {
    maps.subAccounts.set(s.subaccountid, s.subaccountid);
  }

  // 🔹 Commitment Discount
  for (const c of await CommitmentDiscount.findAll()) {
    maps.commitmentDiscounts.set(
      c.commitmentdiscountid,
      c.commitmentdiscountid
    );
  }

  return maps;
}
