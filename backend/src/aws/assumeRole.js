import dotenv from "dotenv";
dotenv.config(); // loads .env from backend/

import {
  STSClient,
  AssumeRoleCommand
} from "@aws-sdk/client-sts";

/**
 * Assumes KCX role using base IAM user credentials
 */
export async function assumeRole() {
  try {
    const {
      AWS_REGION,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_ASSUME_ROLE_ARN,
      AWS_ASSUME_ROLE_SESSION_NAME,
    } = process.env;

    // 🔒 Hard guardrails (fail fast)
    if (!AWS_REGION) throw new Error("AWS_REGION missing");
    if (!AWS_ACCESS_KEY_ID) throw new Error("AWS_ACCESS_KEY_ID missing");
    if (!AWS_SECRET_ACCESS_KEY) throw new Error("AWS_SECRET_ACCESS_KEY missing");
    if (!AWS_ASSUME_ROLE_ARN) throw new Error("AWS_ASSUME_ROLE_ARN missing");
    if (!AWS_ASSUME_ROLE_SESSION_NAME) throw new Error("AWS_ASSUME_ROLE_SESSION_NAME missing");

    const stsClient = new STSClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    const command = new AssumeRoleCommand({
      RoleArn: AWS_ASSUME_ROLE_ARN,
      RoleSessionName: AWS_ASSUME_ROLE_SESSION_NAME,
    });

    const response = await stsClient.send(command);

    return {
      accessKeyId: response.Credentials.AccessKeyId,
      secretAccessKey: response.Credentials.SecretAccessKey,
      sessionToken: response.Credentials.SessionToken,
      expiration: response.Credentials.Expiration,
    };
  } catch (err) {
    console.error("ASSUME ROLE FAILED ❌");
    throw err;
  }
}
