import { v4 as uuidv4 } from "uuid";
import {
  CloudAccount,
  Service,
  Region,
  Sku,
  Resource,
  SubAccount,
  CommitmentDiscount,
} from "../../../../models/index.js";

export async function bulkUpsertDimensions(dims, transaction) {


  if (dims.services.size) {
    await Service.bulkCreate([...dims.services.values()], {
      updateOnDuplicate: ["servicecategory"],
      transaction,
    });
  }

  if (dims.regions.size) {
    await Region.bulkCreate([...dims.regions.values()], {
      updateOnDuplicate: ["regionname", "availabilityzone"],
      transaction,
    });
  }

  if (dims.cloudAccounts.size) {
    await CloudAccount.bulkCreate([...dims.cloudAccounts.values()], {
      updateOnDuplicate: [
        "billingaccountname",
        "billingcurrency",
        "invoiceissuername",
        "publishername",
      ],
      transaction,
    });
  }

  if (dims.skus.size) {
    await Sku.bulkCreate([...dims.skus.values()], {
      updateOnDuplicate: [
        "skupriceid",
        "pricingcategory",
        "pricingunit",
      ],
      transaction,
    });
  }

  if (dims.resources.size) {
    await Resource.bulkCreate([...dims.resources.values()], {
      updateOnDuplicate: ["resourcename", "resourcetype"],
      transaction,
    });
  }

  if (dims.subAccounts.size) {
    await SubAccount.bulkCreate([...dims.subAccounts.values()], {
      updateOnDuplicate: ["subaccountname"],
      transaction,
    });
  }

  if (dims.commitmentDiscounts.size) {
    await CommitmentDiscount.bulkCreate(
      [...dims.commitmentDiscounts.values()],
      {
        updateOnDuplicate: [
          "commitmentdiscountname",
          "commitmentdiscountcategory",
          "commitmentdiscounttype",
          "commitmentdiscountstatus",
        ],
        transaction,
      }
    );
  }
}
