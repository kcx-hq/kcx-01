import { beforeEach, describe, expect, it } from "vitest";
import { BillingUpload } from "../../../src/models/index.js";
import { transitionUploadStatus } from "../../../src/modules/shared/ETL/uploadStatus.service.js";
import {
  createBillingUploadFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

describe("etl upload status transition integration", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("applies valid status transitions through processing lifecycle", async () => {
    const upload = await createBillingUploadFixture({ status: "PENDING" });

    const processing = await transitionUploadStatus({
      uploadId: upload.uploadid,
      toStatus: "PROCESSING",
    });
    const completed = await transitionUploadStatus({
      uploadId: upload.uploadid,
      toStatus: "COMPLETED",
    });

    expect(processing.status).toBe("PROCESSING");
    expect(completed.status).toBe("COMPLETED");
  });

  it("keeps DB unchanged on invalid transition", async () => {
    const upload = await createBillingUploadFixture({ status: "COMPLETED" });

    await expect(
      transitionUploadStatus({
        uploadId: upload.uploadid,
        toStatus: "PROCESSING",
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT",
    });

    const reloaded = await BillingUpload.findByPk(upload.uploadid);
    expect(reloaded.status).toBe("COMPLETED");
  });

  it("is idempotent when applying the same status twice", async () => {
    const upload = await createBillingUploadFixture({ status: "PROCESSING" });

    const first = await transitionUploadStatus({
      uploadId: upload.uploadid,
      toStatus: "PROCESSING",
    });
    const second = await transitionUploadStatus({
      uploadId: upload.uploadid,
      toStatus: "PROCESSING",
    });

    expect(first.status).toBe("PROCESSING");
    expect(second.status).toBe("PROCESSING");
    await expect(BillingUpload.count()).resolves.toBe(1);
  });
});
