import { Op } from "sequelize";
import {
  CloudAccount,
  Service,
  Region,
  Sku,
  Resource,
  SubAccount,
  CommitmentDiscount,
} from "../../../../models/index.js";

function toCloudAccountWhere(dims) {
  if (!dims || !dims.cloudAccounts?.size) {
    return null;
  }

  return {
    [Op.or]: Array.from(dims.cloudAccounts.values()).map((row) => ({
      providername: row.providername,
      billingaccountid: row.billingaccountid,
    })),
  };
}

function toServiceWhere(dims) {
  if (!dims || !dims.services?.size) {
    return null;
  }

  return {
    [Op.or]: Array.from(dims.services.values()).map((row) => ({
      providername: row.providername,
      servicename: row.servicename,
    })),
  };
}

function toRegionWhere(dims) {
  if (!dims || !dims.regions?.size) {
    return null;
  }

  return {
    [Op.or]: Array.from(dims.regions.values()).map((row) => ({
      providername: row.providername,
      regioncode: row.regioncode,
    })),
  };
}

function toSingleKeyWhere(dims, key, column) {
  if (!dims || !dims[key]?.size) {
    return null;
  }

  return {
    [column]: {
      [Op.in]: Array.from(dims[key].keys()),
    },
  };
}

async function loadRows(model, where) {
  if (where === null) {
    return [];
  }
  if (where === undefined) {
    return model.findAll();
  }
  return model.findAll({ where });
}

export async function preloadDimensionMaps(dims) {
  const maps = {
    cloudAccounts: new Map(),
    services: new Map(),
    regions: new Map(),
    skus: new Map(),
    resources: new Map(),
    subAccounts: new Map(),
    commitmentDiscounts: new Map(),
  };

  const cloudAccountsWhere = dims ? toCloudAccountWhere(dims) : undefined;
  const servicesWhere = dims ? toServiceWhere(dims) : undefined;
  const regionsWhere = dims ? toRegionWhere(dims) : undefined;
  const skusWhere = dims ? toSingleKeyWhere(dims, "skus", "skuid") : undefined;
  const resourcesWhere = dims ? toSingleKeyWhere(dims, "resources", "resourceid") : undefined;
  const subAccountsWhere = dims ? toSingleKeyWhere(dims, "subAccounts", "subaccountid") : undefined;
  const commitmentDiscountsWhere = dims
    ? toSingleKeyWhere(dims, "commitmentDiscounts", "commitmentdiscountid")
    : undefined;

  const [
    cloudAccounts,
    services,
    regions,
    skus,
    resources,
    subAccounts,
    commitmentDiscounts,
  ] = await Promise.all([
    loadRows(CloudAccount, cloudAccountsWhere),
    loadRows(Service, servicesWhere),
    loadRows(Region, regionsWhere),
    loadRows(Sku, skusWhere),
    loadRows(Resource, resourcesWhere),
    loadRows(SubAccount, subAccountsWhere),
    loadRows(CommitmentDiscount, commitmentDiscountsWhere),
  ]);

  for (const row of cloudAccounts) {
    maps.cloudAccounts.set(`${row.providername}:${row.billingaccountid}`, row.id);
  }

  for (const row of services) {
    maps.services.set(`${row.providername}:${row.servicename}`, row.serviceid);
  }

  for (const row of regions) {
    maps.regions.set(`${row.providername}:${row.regioncode}`, row.id);
  }

  for (const row of skus) {
    maps.skus.set(row.skuid, row.skuid);
  }

  for (const row of resources) {
    maps.resources.set(row.resourceid, row.resourceid);
  }

  for (const row of subAccounts) {
    maps.subAccounts.set(row.subaccountid, row.subaccountid);
  }

  for (const row of commitmentDiscounts) {
    maps.commitmentDiscounts.set(row.commitmentdiscountid, row.commitmentdiscountid);
  }

  return maps;
}
