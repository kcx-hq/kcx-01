import dotenv from "dotenv";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

/**
 * Assumes AWS role using base IAM user credentials.
 * Supports runtime overrides for role/session/region to enable UI-driven checks.
 */
export default async function assumeRole(options = {}) {
  try {


    

    const {
      AWS_REGION,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
      AWS_ASSUME_ROLE_ARN,
      AWS_ASSUME_ROLE_SESSION_NAME,
    } = process.env;

    

    const region = options.region || AWS_REGION;
    const roleArn = options.roleArn || AWS_ASSUME_ROLE_ARN;
    const roleSessionName =
      options.sessionName ||
      AWS_ASSUME_ROLE_SESSION_NAME ||
      `kcx-session-${Date.now()}`;
    const awsAccessKeyId = options.clientcreds.accessKeyId ;
    const awsSecretAccessKey = options.clientcreds.secretAccessKey ;

    if (!region) throw new Error("AWS_REGION missing");
    if (!awsAccessKeyId) throw new Error("AWS_ACCESS_KEY_ID missing");
    if (!awsSecretAccessKey) throw new Error("AWS_SECRET_ACCESS_KEY missing");
    if (!roleArn) throw new Error("Role ARN missing");

    const stsClient = new STSClient({
      region,
      credentials: {
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey,
      },
    });

    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: roleSessionName,
    });

    const response = await stsClient.send(command);

    return {
      accessKeyId: response.Credentials.AccessKeyId,
      secretAccessKey: response.Credentials.SecretAccessKey,
      sessionToken: response.Credentials.SessionToken,
      expiration: response.Credentials.Expiration,
      assumedRoleArn: response.AssumedRoleUser?.Arn || roleArn,
    };
  } catch (err) {
    console.error("ASSUME ROLE FAILED");
    throw err;
  }
}
