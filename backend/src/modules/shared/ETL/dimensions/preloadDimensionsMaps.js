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

  const cloudAccounts = await loadRows(
    CloudAccount,
    dims ? toCloudAccountWhere(dims) : undefined,
  );
  for (const row of cloudAccounts) {
    maps.cloudAccounts.set(`${row.providername}:${row.billingaccountid}`, row.id);
  }

  const services = await loadRows(
    Service,
    dims ? toServiceWhere(dims) : undefined,
  );
  for (const row of services) {
    maps.services.set(`${row.providername}:${row.servicename}`, row.serviceid);
  }

  const regions = await loadRows(
    Region,
    dims ? toRegionWhere(dims) : undefined,
  );
  for (const row of regions) {
    maps.regions.set(`${row.providername}:${row.regioncode}`, row.id);
  }

  const skus = await loadRows(
    Sku,
    dims ? toSingleKeyWhere(dims, "skus", "skuid") : undefined,
  );
  for (const row of skus) {
    maps.skus.set(row.skuid, row.skuid);
  }

  const resources = await loadRows(
    Resource,
    dims ? toSingleKeyWhere(dims, "resources", "resourceid") : undefined,
  );
  for (const row of resources) {
    maps.resources.set(row.resourceid, row.resourceid);
  }

  const subAccounts = await loadRows(
    SubAccount,
    dims ? toSingleKeyWhere(dims, "subAccounts", "subaccountid") : undefined,
  );
  for (const row of subAccounts) {
    maps.subAccounts.set(row.subaccountid, row.subaccountid);
  }

  const commitmentDiscounts = await loadRows(
    CommitmentDiscount,
    dims
      ? toSingleKeyWhere(dims, "commitmentDiscounts", "commitmentdiscountid")
      : undefined,
  );
  for (const row of commitmentDiscounts) {
    maps.commitmentDiscounts.set(row.commitmentdiscountid, row.commitmentdiscountid);
  }

  return maps;
}
