import express from "express";
import { getForecastingBudgetsSummary } from "./forecasting-budgets.controller.js";

const router = express.Router();

router.get("/summary", getForecastingBudgetsSummary);

export default router;

