import {
  CloudAccount,
  Service,
  Region,
  Sku,
  Resource,
  SubAccount,
  CommitmentDiscount,
} from "../../../../models/index.js";

async function bulkUpsert(model, rows, updateFields, transaction) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }

  await model.bulkCreate(rows, {
    transaction,
    ignoreDuplicates: false,
    updateOnDuplicate: updateFields,
    validate: false,
    logging: false,
  });
}

export async function bulkUpsertDimensions(dims, transaction) {
  await bulkUpsert(
    Service,
    Array.from(dims.services.values()),
    ["servicecategory"],
    transaction,
  );

  await bulkUpsert(
    Region,
    Array.from(dims.regions.values()),
    ["regionname", "availabilityzone"],
    transaction,
  );

  await bulkUpsert(
    CloudAccount,
    Array.from(dims.cloudAccounts.values()),
    ["billingaccountname", "billingcurrency", "invoiceissuername", "publishername"],
    transaction,
  );

  await bulkUpsert(
    Sku,
    Array.from(dims.skus.values()),
    ["skupriceid", "pricingcategory", "pricingunit"],
    transaction,
  );

  await bulkUpsert(
    Resource,
    Array.from(dims.resources.values()),
    ["resourcename", "resourcetype"],
    transaction,
  );

  await bulkUpsert(
    SubAccount,
    Array.from(dims.subAccounts.values()),
    ["subaccountname"],
    transaction,
  );

  await bulkUpsert(
    CommitmentDiscount,
    Array.from(dims.commitmentDiscounts.values()),
    ["commitmentdiscountname", "commitmentdiscountcategory", "commitmentdiscounttype", "commitmentdiscountstatus"],
    transaction,
  );
}
