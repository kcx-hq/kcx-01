import {
  CloudAccount,
  Service,
  Region,
  Sku,
  Resource,
  SubAccount,
  CommitmentDiscount,
} from "../../../../models/index.js";

function chunkArray(arr, size = 1000) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function bulkUpsert(
  Model,
  valuesIter,
  updateOnDuplicate,
  transaction,
  chunkSize = 1000
) {
  const rows = Array.from(valuesIter);
  if (!rows.length) return;

  const chunks = chunkArray(rows, chunkSize);
  for (const chunk of chunks) {
    await Model.bulkCreate(chunk, {
      updateOnDuplicate,
      transaction,
      // returning: false, // enable if Postgres + supported
    });
  }
}

/**
 * bulkUpsertDimensions
 * @param {object} dims
 * @param {object} transaction - sequelize transaction
 * @param {(name:string)=>void} mark - your mark() from ingestBillingCsv
 */
export async function bulkUpsertDimensions(dims, transaction, mark) {
  const chunkSize = 1000;

  // overall marks (optional but useful)
  if (mark) mark("dims_bulkUpsert_start");

  await Promise.all([
    (async () => {
      if (mark) mark("dims_services_start");
      await bulkUpsert(
        Service,
        dims.services.values(),
        ["servicecategory"],
        transaction,
        chunkSize
      );
      if (mark) mark("dims_services_end");
    })(),

    (async () => {
      if (mark) mark("dims_regions_start");
      await bulkUpsert(
        Region,
        dims.regions.values(),
        ["regionname", "availabilityzone"],
        transaction,
        chunkSize
      );
      if (mark) mark("dims_regions_end");
    })(),

    (async () => {
      if (mark) mark("dims_cloudAccounts_start");
      await bulkUpsert(
        CloudAccount,
        dims.cloudAccounts.values(),
        ["billingaccountname", "billingcurrency", "invoiceissuername", "publishername"],
        transaction,
        chunkSize
      );
      if (mark) mark("dims_cloudAccounts_end");
    })(),

    (async () => {
      if (mark) mark("dims_skus_start");
      await bulkUpsert(
        Sku,
        dims.skus.values(),
        ["skupriceid", "pricingcategory", "pricingunit"],
        transaction,
        chunkSize
      );
      if (mark) mark("dims_skus_end");
    })(),

    (async () => {
      if (mark) mark("dims_resources_start");
      await bulkUpsert(
        Resource,
        dims.resources.values(),
        ["resourcename", "resourcetype"],
        transaction,
        chunkSize
      );
      if (mark) mark("dims_resources_end");
    })(),

    (async () => {
      if (mark) mark("dims_subAccounts_start");
      await bulkUpsert(
        SubAccount,
        dims.subAccounts.values(),
        ["subaccountname"],
        transaction,
        chunkSize
      );
      if (mark) mark("dims_subAccounts_end");
    })(),

    (async () => {
      if (mark) mark("dims_commitmentDiscounts_start");
      await bulkUpsert(
        CommitmentDiscount,
        dims.commitmentDiscounts.values(),
        [
          "commitmentdiscountname",
          "commitmentdiscountcategory",
          "commitmentdiscounttype",
          "commitmentdiscountstatus",
        ],
        transaction,
        chunkSize
      );
      if (mark) mark("dims_commitmentDiscounts_end");
    })(),
  ]);

  if (mark) mark("dims_bulkUpsert_end");
}
