import express from "express";
import { decodeUser } from "../../../middlewares/decodeUser.js";
import { verifyAwsRoleConnection } from "./cloud.controller.js";

const router = express.Router();

router.post("/aws/verify-connection", decodeUser, verifyAwsRoleConnection);

export default router;
