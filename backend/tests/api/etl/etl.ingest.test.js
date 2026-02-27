import { beforeEach, describe, expect, it, vi } from "vitest";
import { BillingUpload } from "../../../src/models/index.js";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import { createAuthIdentity } from "../../helpers/authFixtures.js";
import { resetFactoryState } from "../../helpers/factories.js";

describe("etl ingest api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("processes billing csv upload successfully with mocked ingest service", async () => {
    const ingestMock = vi.fn().mockResolvedValue(undefined);
    const client = await createApiClient({
      mocks: [
        {
          path: "../../src/modules/shared/ETL/billingIngest.service.js",
          factory: () => ({
            ingestBillingCsv: ingestMock,
          }),
        },
      ],
    });
    const identity = await createAuthIdentity({
      user: { email: "etl.success@example.test" },
    });

    const response = await client.agent
      .post("/api/etl")
      .set(identity.authHeaders)
      .attach("file", Buffer.from("a,b\n1,2\n"), "billing.csv");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        message: "Billing CSV processed",
        uploadId: expect.any(String),
        status: "COMPLETED",
      }),
    );
    expect(ingestMock).toHaveBeenCalledTimes(1);
  });

  it("returns validation error when upload file is missing", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "etl.missing.file@example.test" },
    });

    const response = await client.post("/api/etl", {
      headers: identity.authHeaders,
      body: {},
    });

    assertErrorContract(response, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request",
    });
  });

  it("denies billing uploads listing without authentication", async () => {
    const client = await createApiClient();
    const response = await client.get("/api/etl/get-billing-uploads");

    assertErrorContract(response, {
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  });

  it("re-submitting same file creates another upload entry under current design", async () => {
    const ingestMock = vi.fn().mockResolvedValue(undefined);
    const client = await createApiClient({
      mocks: [
        {
          path: "../../src/modules/shared/ETL/billingIngest.service.js",
          factory: () => ({
            ingestBillingCsv: ingestMock,
          }),
        },
      ],
    });
    const identity = await createAuthIdentity({
      user: { email: "etl.duplicate@example.test" },
    });

    const first = await client.agent
      .post("/api/etl")
      .set(identity.authHeaders)
      .attach("file", Buffer.from("a,b\n1,2\n"), "billing.csv");

    const second = await client.agent
      .post("/api/etl")
      .set(identity.authHeaders)
      .attach("file", Buffer.from("a,b\n1,2\n"), "billing.csv");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.data.uploadId).not.toBe(second.body.data.uploadId);
    await expect(BillingUpload.count()).resolves.toBe(2);
  });

  it("maps ingest processing failures to internal error contract", async () => {
    const ingestMock = vi.fn().mockRejectedValue(new Error("invalid billing row"));
    const client = await createApiClient({
      mocks: [
        {
          path: "../../src/modules/shared/ETL/billingIngest.service.js",
          factory: () => ({
            ingestBillingCsv: ingestMock,
          }),
        },
      ],
    });
    const identity = await createAuthIdentity({
      user: { email: "etl.failure@example.test" },
    });

    const response = await client.agent
      .post("/api/etl")
      .set(identity.authHeaders)
      .attach("file", Buffer.from("a,b\n1,2\n"), "billing.csv");

    assertErrorContract(response, {
      status: 500,
      code: "INTERNAL",
      message: "Internal server error",
    });
  });
});
