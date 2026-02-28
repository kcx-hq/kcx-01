import express from "express";
import {
  getAdminActivityLogs,
  getAdminActivityFilters,
} from "./activity-logs.controller.js";

const router = express.Router();

router.get("/internal", getAdminActivityLogs);
router.get("/filters", getAdminActivityFilters);

export default router;
