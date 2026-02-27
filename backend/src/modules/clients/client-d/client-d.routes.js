import express from 'express';
import overviewRoutes from './overviews/overview.route.js';
import optimizationRoutes from './optimization/optimization.route.js';
import governanceRoutes from './governance/governance.route.js';
import analyticsRoutes from './analytics/analytics.route.js';
import reportRoutes from './reports/reports.route.js';
import unitEconomicsRoutes from './unit-economics/unit-economics.routes.js';

const router = express.Router();

router.get('/' , (req, res) => {
  return res.ok({ message: "Client D API is working" });
});

router.use('/overview' ,  overviewRoutes)
router.use('/optimization' ,  optimizationRoutes)
router.use('/governance' ,  governanceRoutes)
router.use('/analytics' ,  analyticsRoutes)
router.use('/reports' ,  reportRoutes)
router.use('/unit-economics' ,  unitEconomicsRoutes)
export default router;
