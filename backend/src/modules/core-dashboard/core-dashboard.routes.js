import express from "express";
import { decodeUser } from "../../middlewares/decodeUser.js";
import overviewRoutes from './overviews/overview.route.js';
import reportsRoutes from './reports/reports.routes.js';
import optimizationRoutes from './optimization/optimization.routes.js';
import governanceRoutes from './governance/governance.routes.js';
import governanceDataQualityRoutes from "./governance-data-quality/governance-data-quality.routes.js";
import analyticsRoutes from './analytics/analytics.routes.js';
import unitEconomicsRoutes from './unit-economics/unit-economics.routes.js';
import forecastingBudgetsRoutes from './forecasting-budgets/forecasting-budgets.routes.js';
import alertsIncidentsRoutes from './alerts-incidents/alerts-incidents.routes.js';

const router = express.Router();
router.use(decodeUser);

router.use('/overview', overviewRoutes); 
router.use('/reports', reportsRoutes);
router.use('/optimization', optimizationRoutes);
router.use('/governance', governanceRoutes);
router.use("/governance-data-quality", governanceDataQualityRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/unit-economics' , unitEconomicsRoutes)
router.use('/forecasting-budgets', forecastingBudgetsRoutes);
router.use('/alerts-incidents', alertsIncidentsRoutes);

export default router;
