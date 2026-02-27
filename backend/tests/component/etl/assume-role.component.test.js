import { beforeEach, describe, expect, it, vi } from "vitest";

const { envMock, stsSendMock, stsClientCtorMock, assumeRoleCommandCtorMock } = vi.hoisted(() => {
  const env = {
    AWS_REGION: "us-east-1",
    AWS_ACCESS_KEY_ID: "env-access-key",
    AWS_SECRET_ACCESS_KEY: "env-secret-key",
    AWS_ASSUME_ROLE_ARN: "arn:aws:iam::123456789012:role/default-role",
    AWS_ASSUME_ROLE_SESSION_NAME: "default-session",
  };
  const send = vi.fn();
  const clientCtor = vi.fn(function STSClientMock() {
    this.send = send;
  });
  const commandCtor = vi.fn(function AssumeRoleCommandMock(input) {
    this.__type = "AssumeRoleCommand";
    this.input = input;
  });

  return {
    envMock: env,
    stsSendMock: send,
    stsClientCtorMock: clientCtor,
    assumeRoleCommandCtorMock: commandCtor,
  };
});

vi.mock("../../../src/config/env.js", () => ({
  default: envMock,
  env: envMock,
}));

vi.mock("@aws-sdk/client-sts", () => ({
  STSClient: stsClientCtorMock,
  AssumeRoleCommand: assumeRoleCommandCtorMock,
}));

vi.mock("../../../src/lib/logger.js", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import assumeRole from "../../../src/aws/assumeRole.js";

describe("etl component - assume role adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    envMock.AWS_REGION = "us-east-1";
    envMock.AWS_ACCESS_KEY_ID = "env-access-key";
    envMock.AWS_SECRET_ACCESS_KEY = "env-secret-key";
    envMock.AWS_ASSUME_ROLE_ARN = "arn:aws:iam::123456789012:role/default-role";
    envMock.AWS_ASSUME_ROLE_SESSION_NAME = "default-session";
  });

  it("builds sts request with env credentials and returns normalized credential shape", async () => {
    stsSendMock.mockResolvedValueOnce({
      Credentials: {
        AccessKeyId: "temp-access",
        SecretAccessKey: "temp-secret",
        SessionToken: "temp-token",
        Expiration: "2026-06-01T00:00:00.000Z",
      },
      AssumedRoleUser: {
        Arn: "arn:aws:sts::123456789012:assumed-role/default-role/default-session",
      },
    });

    const result = await assumeRole();

    expect(stsClientCtorMock).toHaveBeenCalledWith({
      region: "us-east-1",
      credentials: {
        accessKeyId: "env-access-key",
        secretAccessKey: "env-secret-key",
      },
    });
    expect(assumeRoleCommandCtorMock).toHaveBeenCalledWith({
      RoleArn: "arn:aws:iam::123456789012:role/default-role",
      RoleSessionName: "default-session",
    });

    expect(result).toEqual({
      accessKeyId: "temp-access",
      secretAccessKey: "temp-secret",
      sessionToken: "temp-token",
      expiration: "2026-06-01T00:00:00.000Z",
      assumedRoleArn: "arn:aws:sts::123456789012:assumed-role/default-role/default-session",
    });
  });

  it("supports runtime overrides and fallback client credentials", async () => {
    envMock.AWS_ACCESS_KEY_ID = "";
    envMock.AWS_SECRET_ACCESS_KEY = "";

    stsSendMock.mockResolvedValueOnce({
      Credentials: {
        AccessKeyId: "override-access",
        SecretAccessKey: "override-secret",
        SessionToken: "override-token",
        Expiration: "2026-07-01T00:00:00.000Z",
      },
      AssumedRoleUser: {},
    });

    const result = await assumeRole({
      region: "eu-west-1",
      roleArn: "arn:aws:iam::999999999999:role/override-role",
      sessionName: "custom-session",
      clientcreds: {
        accessKeyId: "client-access",
        secretAccessKey: "client-secret",
      },
    });

    expect(stsClientCtorMock).toHaveBeenCalledWith({
      region: "eu-west-1",
      credentials: {
        accessKeyId: "client-access",
        secretAccessKey: "client-secret",
      },
    });
    expect(assumeRoleCommandCtorMock).toHaveBeenCalledWith({
      RoleArn: "arn:aws:iam::999999999999:role/override-role",
      RoleSessionName: "custom-session",
    });
    expect(result.assumedRoleArn).toBe("arn:aws:iam::999999999999:role/override-role");
  });

  it("fails fast when required config is missing", async () => {
    envMock.AWS_ASSUME_ROLE_ARN = "";

    await expect(assumeRole()).rejects.toThrow("Role ARN missing");
    expect(stsClientCtorMock).not.toHaveBeenCalled();
  });

  it("propagates sts failures", async () => {
    stsSendMock.mockRejectedValueOnce(new Error("sts unavailable"));

    await expect(assumeRole()).rejects.toThrow("sts unavailable");
  });
});
