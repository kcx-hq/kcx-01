import express from "express";
import { getAlertsIncidentsSummary } from "./alerts-incidents.controller.js";

const router = express.Router();

router.get("/summary", getAlertsIncidentsSummary);

export default router;

