import express from "express";
import { decodeUser } from "../../../middlewares/decodeUser.js";
import {
  connectAwsRole,
  getCloudConnectionFiles,
  selectCloudFile,
  verifyAwsRoleConnection,
} from "./cloud.controller.js";

const router = express.Router();

router.post("/aws/verify-connection", decodeUser, verifyAwsRoleConnection);
router.post("/aws/connect", decodeUser, connectAwsRole);
router.post("/aws/files", decodeUser, getCloudConnectionFiles);
router.post("/aws/ingest", decodeUser, selectCloudFile);

export default router;
