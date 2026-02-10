import dotenv from "dotenv";
dotenv.config(); // MUST be first

import { assumeRole } from "./assumeRole.js";

async function test() {
  try {
    console.log("ENV CHECK");
    console.log("AWS_REGION =", process.env.AWS_REGION);
    console.log("ROLE ARN =", process.env.AWS_ASSUME_ROLE_ARN);
    console.log("----------------------");

    const creds = await assumeRole();

    console.log("ASSUME ROLE SUCCESS ✅");
    console.log({
      accessKeyId: creds.accessKeyId,
      expiration: creds.expiration,
    });
  } catch (err) {
    console.error(err.message);
  }
}

test();
