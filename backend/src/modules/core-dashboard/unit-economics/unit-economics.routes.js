import express from "express";
import { getUnitEconomicsSummary } from "./unit-economics.controller.js";

const router = express.Router();

router.get("/summary", getUnitEconomicsSummary);

export default router;
