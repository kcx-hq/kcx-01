import { beforeEach, describe, expect, it } from "vitest";
import sequelize from "../../../src/config/db.config.js";
import {
  BillingColumnMapping,
  BillingDetectedColumn,
  BillingUsageFact,
  CloudAccount,
  CommitmentDiscount,
  MappingSuggestion,
  Region,
  Resource,
  Service,
  Sku,
  SubAccount,
} from "../../../src/models/index.js";
import {
  bulkUpsertDimensions,
} from "../../../src/modules/shared/ETL/dimensions/bulkUpsertDimensions.js";
import { collectDimensions } from "../../../src/modules/shared/ETL/dimensions/collectDimensions.js";
import { preloadDimensionMaps } from "../../../src/modules/shared/ETL/dimensions/preloadDimensionsMaps.js";
import { resolveDimensionIdsFromMaps } from "../../../src/modules/shared/ETL/dimensions/resolveFromMaps.js";
import { flushFacts, pushFact } from "../../../src/modules/shared/ETL/fact/billingUsageFact.js";
import {
  loadMapping,
  loadResolvedMapping,
  storeAutoSuggestions,
  storeDetectedColumns,
} from "../../../src/modules/shared/ETL/mapping.service.js";
import {
  createBillingColumnMappingFixture,
  createBillingUploadFixture,
  createClientFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

function buildDimensionSet() {
  return {
    cloudAccounts: new Map([
      [
        "aws:acct-1001",
        {
          providername: "aws",
          billingaccountid: "acct-1001",
          billingaccountname: "Primary",
          billingcurrency: "USD",
          invoiceissuername: "AWS",
          publishername: "Amazon",
        },
      ],
    ]),
    services: new Map([
      [
        "aws:AmazonEC2",
        {
          providername: "aws",
          servicename: "AmazonEC2",
          servicecategory: "Compute",
        },
      ],
    ]),
    regions: new Map([
      [
        "aws:us-east-1",
        {
          providername: "aws",
          regioncode: "us-east-1",
          regionname: "US East",
          availabilityzone: "us-east-1a",
        },
      ],
    ]),
    skus: new Map([
      [
        "sku-1001",
        {
          skuid: "sku-1001",
          skupriceid: "price-1001",
          pricingcategory: "OnDemand",
          pricingunit: "Hours",
        },
      ],
    ]),
    resources: new Map([
      [
        "resource-1001",
        {
          resourceid: "resource-1001",
          resourcename: "api-node-1",
          resourcetype: "ec2:instance",
        },
      ],
    ]),
    subAccounts: new Map([
      [
        "sub-1001",
        {
          subaccountid: "sub-1001",
          subaccountname: "Engineering",
        },
      ],
    ]),
    commitmentDiscounts: new Map([
      [
        "cd-1001",
        {
          commitmentdiscountid: "cd-1001",
          commitmentdiscountname: "Savings Plan",
          commitmentdiscountcategory: "SavingsPlan",
          commitmentdiscounttype: "Compute",
          commitmentdiscountstatus: "Active",
        },
      ],
    ]),
  };
}

describe("etl integration services", () => {
  beforeEach(async () => {
    resetFactoryState();
    await flushFacts();
  });

  it("stores detected columns for a client and provider", async () => {
    const client = await createClientFixture();
    await storeDetectedColumns(
      "aws",
      ["Provider Name", "provider_name", "Billed Cost"],
      client.id,
    );

    const rows = await BillingDetectedColumn.findAll({
      where: { clientid: client.id, provider: "aws" },
      order: [["column_name", "ASC"]],
    });

    expect(rows.map((r) => r.column_name)).toEqual([
      "billed_cost",
      "provider_name",
    ]);
  });

  it("ignores empty detected column payloads", async () => {
    const client = await createClientFixture();
    await storeDetectedColumns("aws", [], client.id);
    await expect(
      BillingDetectedColumn.count({ where: { clientid: client.id } }),
    ).resolves.toBe(0);
  });

  it("stores mapping suggestions and auto-created mappings", async () => {
    const client = await createClientFixture();
    const upload = await createBillingUploadFixture({ clientid: client.id });

    await storeAutoSuggestions(
      "aws",
      upload.uploadid,
      [
        {
          csvColumn: "Provider Name",
          autoMapped: true,
          suggestions: [
            { field: "providername", score: 0.99, reasons: ["exact"] },
          ],
        },
        {
          csvColumn: "Cost",
          autoMapped: false,
          suggestions: [
            { field: "billedcost", score: 0.88, reasons: ["semantic"] },
          ],
        },
      ],
      client.id,
    );

    await expect(
      MappingSuggestion.count({ where: { clientid: client.id } }),
    ).resolves.toBe(2);
    await expect(
      BillingColumnMapping.count({
        where: { clientid: client.id, internal_field: "providername" },
      }),
    ).resolves.toBe(1);
  });

  it("loads mapping rows by provider and client scope", async () => {
    const client = await createClientFixture();
    await createBillingColumnMappingFixture({
      clientid: client.id,
      provider: "aws",
      internal_field: "providername",
      source_column: "Provider Name",
    });
    await createBillingColumnMappingFixture({
      clientid: client.id,
      provider: "aws",
      internal_field: "billedcost",
      source_column: "Billed Cost",
    });

    const mapping = await loadMapping("aws", client.id);
    expect(mapping).toEqual({
      providername: "Provider Name",
      billedcost: "Billed Cost",
    });
  });

  it("resolves raw headers from stored mapping config", async () => {
    const client = await createClientFixture();
    await createBillingColumnMappingFixture({
      clientid: client.id,
      provider: "aws",
      internal_field: "providername",
      source_column: "provider_name",
    });
    await createBillingColumnMappingFixture({
      clientid: client.id,
      provider: "aws",
      internal_field: "billedcost",
      source_column: "Billed Cost",
    });

    const resolved = await loadResolvedMapping(
      "aws",
      ["Provider Name", "Billed Cost", "Ignored"],
      client.id,
    );

    expect(resolved.providername).toBe("Provider Name");
    expect(resolved.billedcost).toBe("Billed Cost");
  });

  it("enforces client isolation when loading mappings", async () => {
    const clientA = await createClientFixture({ email: "a@example.test" });
    const clientB = await createClientFixture({ email: "b@example.test" });

    await createBillingColumnMappingFixture({
      clientid: clientA.id,
      provider: "aws",
      internal_field: "providername",
      source_column: "ProviderA",
    });
    await createBillingColumnMappingFixture({
      clientid: clientB.id,
      provider: "aws",
      internal_field: "providername",
      source_column: "ProviderB",
    });

    const mappingA = await loadMapping("aws", clientA.id);
    const mappingB = await loadMapping("aws", clientB.id);

    expect(mappingA.providername).toBe("ProviderA");
    expect(mappingB.providername).toBe("ProviderB");
  });

  it("upserts dimensions and writes rows to dimension tables", async () => {
    const dims = buildDimensionSet();
    const tx = await sequelize.transaction();
    try {
      await bulkUpsertDimensions(dims, tx);
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    }

    await expect(CloudAccount.count()).resolves.toBe(1);
    await expect(Service.count()).resolves.toBe(1);
    await expect(Region.count()).resolves.toBe(1);
    await expect(Sku.count()).resolves.toBe(1);
    await expect(Resource.count()).resolves.toBe(1);
    await expect(SubAccount.count()).resolves.toBe(1);
    await expect(CommitmentDiscount.count()).resolves.toBe(1);
  });

  it("keeps natural-key dimension tables idempotent on reprocessing", async () => {
    const dims = buildDimensionSet();
    const firstTx = await sequelize.transaction();
    await bulkUpsertDimensions(dims, firstTx);
    await firstTx.commit();

    const before = {
      skus: await Sku.count(),
      resources: await Resource.count(),
      subAccounts: await SubAccount.count(),
      discounts: await CommitmentDiscount.count(),
    };

    const secondTx = await sequelize.transaction();
    await bulkUpsertDimensions(dims, secondTx);
    await secondTx.commit();

    const after = {
      skus: await Sku.count(),
      resources: await Resource.count(),
      subAccounts: await SubAccount.count(),
      discounts: await CommitmentDiscount.count(),
    };

    expect(after).toEqual(before);
  });

  it("preloads dimension maps and resolves fact dimension ids", async () => {
    const dims = buildDimensionSet();
    const tx = await sequelize.transaction();
    await bulkUpsertDimensions(dims, tx);
    await tx.commit();

    const maps = await preloadDimensionMaps();
    const resolved = resolveDimensionIdsFromMaps(
      {
        providername: "aws",
        billingaccountid: "acct-1001",
        servicename: "AmazonEC2",
        regioncode: "us-east-1",
        skuid: "sku-1001",
        resourceid: "resource-1001",
        subaccountid: "sub-1001",
        commitmentdiscountid: "cd-1001",
      },
      maps,
    );

    expect(resolved.cloudaccountid).toBeTruthy();
    expect(resolved.serviceid).toBeTruthy();
    expect(resolved.regionid).toBeTruthy();
    expect(resolved.skuid).toBe("sku-1001");
    expect(resolved.resourceid).toBe("resource-1001");
  });

  it("pushes and flushes facts into billing_usage_fact", async () => {
    const dims = buildDimensionSet();
    const tx = await sequelize.transaction();
    await bulkUpsertDimensions(dims, tx);
    await tx.commit();
    const maps = await preloadDimensionMaps();
    const upload = await createBillingUploadFixture();

    const resolved = resolveDimensionIdsFromMaps(
      {
        providername: "aws",
        billingaccountid: "acct-1001",
        servicename: "AmazonEC2",
        regioncode: "us-east-1",
        skuid: "sku-1001",
        resourceid: "resource-1001",
        subaccountid: "sub-1001",
        commitmentdiscountid: "cd-1001",
      },
      maps,
    );

    await pushFact(
      upload.uploadid,
      {
        chargecategory: "Usage",
        chargeclass: "OnDemand",
        billedcost: 12.5,
        effectivecost: 11.2,
        consumedquantity: 10,
        chargeperiodstart: "2026-01-01T00:00:00.000Z",
        chargeperiodend: "2026-01-01T23:00:00.000Z",
        tags: JSON.stringify({ team: "platform" }),
      },
      resolved,
    );
    await flushFacts();

    const rows = await BillingUsageFact.findAll();
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].billedcost)).toBeCloseTo(12.5, 5);
  });

  it("keeps DB unchanged on invalid fact rows that violate not-null dimensions", async () => {
    const beforeCount = await BillingUsageFact.count();
    const upload = await createBillingUploadFixture();

    await pushFact(
      upload.uploadid,
      {
        chargecategory: "Usage",
        billedcost: 5,
        chargeperiodstart: "2026-01-02T00:00:00.000Z",
      },
      {
        cloudaccountid: null,
        serviceid: null,
        regionid: null,
        skuid: null,
        resourceid: null,
        subaccountid: null,
        commitmentdiscountid: null,
      },
    );
    await flushFacts();

    await expect(BillingUsageFact.count()).resolves.toBe(beforeCount);
  });

  it("rolls back dimension transaction on data-quality failures", async () => {
    const tx = await sequelize.transaction();
    const beforeCount = await Service.count();

    try {
      await bulkUpsertDimensions(
        {
          cloudAccounts: new Map(),
          services: new Map([
            [
              "broken",
              {
                providername: null,
                servicename: "BrokenService",
                servicecategory: "Compute",
              },
            ],
          ]),
          regions: new Map(),
          skus: new Map(),
          resources: new Map(),
          subAccounts: new Map(),
          commitmentDiscounts: new Map(),
        },
        tx,
      );
      await tx.commit();
    } catch {
      await tx.rollback();
    }

    await expect(Service.count()).resolves.toBe(beforeCount);
  });

  it("handles moderate batch ingestion and preserves numeric invariants", async () => {
    const upload = await createBillingUploadFixture();
    const cloud = await CloudAccount.create({
      id: "00000000-0000-4000-8000-000000009001",
      providername: "aws",
      billingaccountid: "acct-batch",
      billingaccountname: "Batch Account",
      billingcurrency: "USD",
    });
    const service = await Service.create({
      serviceid: "00000000-0000-4000-8000-000000009002",
      providername: "aws",
      servicename: "AmazonS3",
      servicecategory: "Storage",
    });
    const region = await Region.create({
      id: "00000000-0000-4000-8000-000000009003",
      providername: "aws",
      regioncode: "us-west-2",
      regionname: "US West",
      availabilityzone: "us-west-2a",
    });

    for (let i = 0; i < 60; i += 1) {
      await pushFact(
        upload.uploadid,
        {
          chargecategory: "Usage",
          chargeclass: "OnDemand",
          billedcost: 2.5,
          effectivecost: 2.5,
          consumedquantity: 1,
          chargeperiodstart: new Date(`2026-02-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`),
          chargeperiodend: new Date(`2026-02-${String((i % 28) + 1).padStart(2, "0")}T01:00:00.000Z`),
          tags: JSON.stringify({ env: "batch" }),
        },
        {
          cloudaccountid: cloud.id,
          serviceid: service.serviceid,
          regionid: region.id,
          skuid: "sku-batch",
          resourceid: "resource-batch",
          subaccountid: "sub-batch",
          commitmentdiscountid: "cd-batch",
        },
      );
    }
    await flushFacts();

    const rows = await BillingUsageFact.findAll({
      where: { uploadid: upload.uploadid },
    });
    const total = rows.reduce((sum, row) => sum + Number(row.billedcost || 0), 0);

    expect(rows.length).toBe(60);
    expect(total).toBeCloseTo(150, 5);
  }, 8000);

  it("collects dimensions from mapped rows for ingest preparation", async () => {
    const dims = await collectDimensions([
      {
        providername: "aws",
        billingaccountid: "acct-collect",
        servicename: "AmazonRDS",
        regioncode: "eu-west-1",
        skuid: "sku-collect",
        resourceid: "resource-collect",
        subaccountid: "sub-collect",
        commitmentdiscountid: "cd-collect",
      },
    ]);

    expect(dims.cloudAccounts.size).toBe(1);
    expect(dims.services.size).toBe(1);
    expect(dims.regions.size).toBe(1);
    expect(dims.skus.size).toBe(1);
  });
});
