import assumeRole from "./assumeRole.js";
import logger from "../lib/logger.js";

export async function test() {
  try {
    logger.info("ENV CHECK");
    logger.info("AWS_REGION =", process.env.AWS_REGION);
    logger.info("ROLE ARN =", process.env.AWS_ASSUME_ROLE_ARN);
    logger.info("----------------------");

    const creds = await assumeRole();

    logger.info("ASSUME ROLE SUCCESS ✅");
    logger.info({
      accessKeyId: creds.accessKeyId,
      expiration: creds.expiration,
    });
  } catch (err) {
    logger.error(err.message);
  }
}

test();
