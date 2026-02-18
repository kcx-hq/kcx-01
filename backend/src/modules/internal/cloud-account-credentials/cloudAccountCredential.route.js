import express from "express";
import { createCloudAccountCredential } from "./cloudAccountCredential.controller.js";

const router = express.Router();

// POST /api/cloud-accounts
router.post("/", createCloudAccountCredential);

export default router;
