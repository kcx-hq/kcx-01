import express from "express";
import {
  getClientDSummary,
  getClientDTopServices,
  getClientDTopRegions,
} from "./reports.controller.js";

const router = express.Router();

// Reduced endpoints only
router.get("/summary", getClientDSummary);
router.get("/top-services", getClientDTopServices);
router.get("/top-regions", getClientDTopRegions);

export default router;
