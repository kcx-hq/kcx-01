import express from "express";
import { decodeUser } from "../../middlewares/decodeUser.js";
import overviewRoutes from './overviews/overview.route.js';
import reportsRoutes from './reports/reports.routes.js';
import optimizationRoutes from './optimization/optimization.routes.js';
import governanceRoutes from './governance/governance.routes.js';
import analyticsRoutes from './analytics/analytics.routes.js';
import unitEconomicsRoutes from './unit-economics/unit-economics.routes.js';

const router = express.Router();
router.use(decodeUser);

router.use('/overview', overviewRoutes); 
router.use('/reports', reportsRoutes);
router.use('/optimization', optimizationRoutes);
router.use('/governance', governanceRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/unit-economics' , unitEconomicsRoutes)

export default router;
