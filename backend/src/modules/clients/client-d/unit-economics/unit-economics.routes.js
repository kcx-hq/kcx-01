import express from "express";
import { getClientDUnitEconomicsSummary } from "./unit-economics.controller.js";

const router = express.Router();

router.get("/summary", getClientDUnitEconomicsSummary);

export default router;
