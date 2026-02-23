import express from "express";
import {
  exportDataExplorerCsv,
  getAllocationChargeback,
  getCommitmentsRates,
  getDataExplorer,
  getExecutiveOverview,
  getFilters,
  getForecastingBudgets,
  getGovernanceDataHealth,
  getHealth,
  getOptimizationResources,
  getReports,
  getSpendIntelligence,
  getUnitEconomics,
} from "./dashboard.controller.js";

const router = express.Router();

router.get("/", getHealth);
router.get("/filters", getFilters);

router.get("/executive-overview", getExecutiveOverview);

router.get("/data-explorer", getDataExplorer);
router.get("/data-explorer/export-csv", exportDataExplorerCsv);

router.get("/spend-intelligence", getSpendIntelligence);
router.get("/allocation-chargeback", getAllocationChargeback);
router.get("/optimization-resources", getOptimizationResources);
router.get("/commitments-rates", getCommitmentsRates);
router.get("/forecasting-budgets", getForecastingBudgets);
router.get("/unit-economics", getUnitEconomics);
router.get("/governance-data-health", getGovernanceDataHealth);
router.get("/reports", getReports);

export default router;

