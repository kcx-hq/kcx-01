import express from "express";
import {
  getForecastingBudgetsSummary,
  saveForecastingBudgetTarget,
} from "./forecasting-budgets.controller.js";

const router = express.Router();

router.get("/summary", getForecastingBudgetsSummary);
router.post("/budget-target", saveForecastingBudgetTarget);

export default router;

