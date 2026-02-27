import {
  CloudAccount,
  Service,
  Region,
  Sku,
  Resource,
  SubAccount,
  CommitmentDiscount,
} from "../../../../models/index.js";

async function upsertByWhere(model, where, values, transaction) {
  const existing = await model.findOne({ where, transaction });

  if (!existing) {
    await model.create(values, { transaction });
    return;
  }

  await existing.update(values, { transaction });
}

async function upsertByPrimaryKey(model, primaryKeyField, values, transaction) {
  const primaryKeyValue = values?.[primaryKeyField];
  if (!primaryKeyValue) {
    return;
  }

  const existing = await model.findByPk(primaryKeyValue, { transaction });
  if (!existing) {
    await model.create(values, { transaction });
    return;
  }

  await existing.update(values, { transaction });
}

export async function bulkUpsertDimensions(dims, transaction) {
  if (dims.services.size) {
    for (const service of dims.services.values()) {
      await upsertByWhere(
        Service,
        {
          providername: service.providername,
          servicename: service.servicename,
        },
        service,
        transaction,
      );
    }
  }

  if (dims.regions.size) {
    for (const region of dims.regions.values()) {
      await upsertByWhere(
        Region,
        {
          providername: region.providername,
          regioncode: region.regioncode,
        },
        region,
        transaction,
      );
    }
  }

  if (dims.cloudAccounts.size) {
    for (const cloudAccount of dims.cloudAccounts.values()) {
      await upsertByWhere(
        CloudAccount,
        {
          providername: cloudAccount.providername,
          billingaccountid: cloudAccount.billingaccountid,
        },
        cloudAccount,
        transaction,
      );
    }
  }

  if (dims.skus.size) {
    for (const sku of dims.skus.values()) {
      await upsertByPrimaryKey(Sku, "skuid", sku, transaction);
    }
  }

  if (dims.resources.size) {
    for (const resource of dims.resources.values()) {
      await upsertByPrimaryKey(Resource, "resourceid", resource, transaction);
    }
  }

  if (dims.subAccounts.size) {
    for (const subAccount of dims.subAccounts.values()) {
      await upsertByPrimaryKey(
        SubAccount,
        "subaccountid",
        subAccount,
        transaction,
      );
    }
  }

  if (dims.commitmentDiscounts.size) {
    for (const commitmentDiscount of dims.commitmentDiscounts.values()) {
      await upsertByPrimaryKey(
        CommitmentDiscount,
        "commitmentdiscountid",
        commitmentDiscount,
        transaction,
      );
    }
  }
}
