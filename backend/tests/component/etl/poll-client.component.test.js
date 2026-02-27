import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  s3SendMock,
  s3ClientCtorMock,
  listCommandCtorMock,
  headCommandCtorMock,
  assumeRoleMock,
  ingestS3FileMock,
  billingUploadFindOneMock,
  billingUploadCreateMock,
} = vi.hoisted(() => {
  const send = vi.fn();
  const s3Ctor = vi.fn(function S3ClientMock() {
    this.send = send;
  });
  const listCtor = vi.fn(function ListObjectsV2CommandMock(input) {
    this.__type = "ListObjectsV2Command";
    this.input = input;
  });
  const headCtor = vi.fn(function HeadObjectCommandMock(input) {
    this.__type = "HeadObjectCommand";
    this.input = input;
  });

  return {
    s3SendMock: send,
    s3ClientCtorMock: s3Ctor,
    listCommandCtorMock: listCtor,
    headCommandCtorMock: headCtor,
    assumeRoleMock: vi.fn(),
    ingestS3FileMock: vi.fn(),
    billingUploadFindOneMock: vi.fn(),
    billingUploadCreateMock: vi.fn(),
  };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: s3ClientCtorMock,
  ListObjectsV2Command: listCommandCtorMock,
  HeadObjectCommand: headCommandCtorMock,
}));

vi.mock("../../../src/aws/assumeRole.js", () => ({
  default: assumeRoleMock,
}));

vi.mock("../../../src/modules/shared/ETL/ingestS3File.js", () => ({
  ingestS3File: ingestS3FileMock,
}));

vi.mock("../../../src/models/index.js", () => ({
  BillingUpload: {
    findOne: billingUploadFindOneMock,
    create: billingUploadCreateMock,
  },
}));

vi.mock("../../../src/lib/logger.js", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { pollClient } from "../../../src/modules/shared/ETL/pollClient.js";

describe("etl component - poll client service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    assumeRoleMock.mockResolvedValue({
      accessKeyId: "assumed-access",
      secretAccessKey: "assumed-secret",
      sessionToken: "assumed-token",
    });
  });

  it("ingests unseen objects and persists upload metadata", async () => {
    const lastModified = new Date("2026-06-01T00:00:00.000Z");

    s3SendMock
      .mockResolvedValueOnce({
        Contents: [
          { Key: "billing/client-a.csv", Size: 128, LastModified: lastModified },
          { Key: "billing/folder/", Size: 0, LastModified: lastModified },
        ],
      })
      .mockResolvedValueOnce({
        ContentLength: 128,
        LastModified: lastModified,
      });

    billingUploadFindOneMock.mockResolvedValueOnce(null);
    billingUploadCreateMock.mockResolvedValueOnce({ uploadid: "upload-1001" });

    await pollClient({
      clientid: "client-1",
      Bucket: "billing-bucket",
      prefix: "billing/",
      uploadedby: "user-1",
    });

    expect(assumeRoleMock).toHaveBeenCalledTimes(1);
    expect(s3ClientCtorMock).toHaveBeenCalledWith({
      region: "ap-south-1",
      credentials: {
        accessKeyId: "assumed-access",
        secretAccessKey: "assumed-secret",
        sessionToken: "assumed-token",
      },
    });

    expect(listCommandCtorMock).toHaveBeenCalledWith({
      Bucket: "billing-bucket",
      Prefix: "billing/",
    });
    expect(headCommandCtorMock).toHaveBeenCalledWith({
      Bucket: "billing-bucket",
      Key: "billing/client-a.csv",
    });

    expect(billingUploadCreateMock).toHaveBeenCalledTimes(1);
    const createPayload = billingUploadCreateMock.mock.calls[0][0];
    expect(createPayload).toEqual(
      expect.objectContaining({
        clientid: "client-1",
        uploadedby: "user-1",
        filename: "billing/client-a.csv",
        filesize: 128,
        checksum: "billing/client-a.csv:128:2026-06-01T00:00:00.000Z",
        uploadedat: lastModified,
      }),
    );
    expect(createPayload.billingperiodstart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(createPayload.billingperiodend).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    expect(ingestS3FileMock).toHaveBeenCalledTimes(1);
    expect(ingestS3FileMock).toHaveBeenCalledWith({
      clientid: "client-1",
      uploadId: "upload-1001",
      Bucket: "billing-bucket",
      s3Key: "billing/client-a.csv",
    });
  });

  it("skips objects that already exist for the same client and fingerprint", async () => {
    const lastModified = new Date("2026-06-02T00:00:00.000Z");

    s3SendMock
      .mockResolvedValueOnce({
        Contents: [{ Key: "billing/client-b.csv", Size: 64, LastModified: lastModified }],
      })
      .mockResolvedValueOnce({
        ContentLength: 64,
        LastModified: lastModified,
      });

    billingUploadFindOneMock.mockResolvedValueOnce({ uploadid: "existing-1" });

    await pollClient({
      clientid: "client-2",
      Bucket: "billing-bucket",
      prefix: "billing/",
      uploadedby: "user-2",
    });

    expect(billingUploadCreateMock).not.toHaveBeenCalled();
    expect(ingestS3FileMock).not.toHaveBeenCalled();
  });

  it("ignores entries that are invalid folders or have no last modified timestamp", async () => {
    s3SendMock
      .mockResolvedValueOnce({
        Contents: [
          { Key: "billing/folder/", Size: 0 },
          { Key: null, Size: 0 },
          { Key: "billing/client-c.csv", Size: 10, LastModified: null },
        ],
      })
      .mockResolvedValueOnce({
        ContentLength: 10,
        LastModified: null,
      });

    await pollClient({
      clientid: "client-3",
      Bucket: "billing-bucket",
      prefix: "billing/",
      uploadedby: "user-3",
    });

    expect(billingUploadFindOneMock).not.toHaveBeenCalled();
    expect(billingUploadCreateMock).not.toHaveBeenCalled();
    expect(ingestS3FileMock).not.toHaveBeenCalled();
  });
});
