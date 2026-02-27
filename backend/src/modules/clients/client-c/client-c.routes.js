/**
 * Client-C Dashboard Routes
 * Governance-heavy, operations-first customization
 */

import express from 'express';

// Import all Client-C module routes
import overviewRoutes from './overview/overview.routes.js';
import dataExplorerRoutes from './data-explorer/data-explorer.routes.js';
import costAnalysisRoutes from './cost-analysis/cost-analysis.routes.js';
import costDriversRoutes from './cost-drivers/costDriver.routes.js'
import resourcesRoutes from './resources/resources.routes.js';

import governanceRoutes from './governance/governance.routes.js';
import dataQualityRoutes from './data-quality/data-quality.routes.js';
import optimizationRoutes from './optimization/optimization.routes.js';
import reportsRoutes from './reports/reports.routes.js';
import departmentCostRoutes from './department-cost/department-cost.routes.js';
import costAlertsRoutes from './cost-alerts/cost-alerts.routes.js';
import projectTrackingRoutes from './project-tracking/project-tracking.routes.js';

const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.ok({
    message: 'Client-C Dashboard API',
    version: '1.0.0',
    description: 'Governance-focused operational dashboard'
  });
});

// Mount module routes
router.use('/overview', overviewRoutes);
router.use('/data-explorer', dataExplorerRoutes);
router.use('/cost-analysis', costAnalysisRoutes);
router.use('/cost-drivers', costDriversRoutes);
router.use('/resources', resourcesRoutes);

router.use('/governance', governanceRoutes);
router.use('/data-quality', dataQualityRoutes);
router.use('/optimization', optimizationRoutes);
router.use('/reports', reportsRoutes);
router.use('/department-cost', departmentCostRoutes);
router.use('/cost-alerts', costAlertsRoutes);
router.use('/project-tracking', projectTrackingRoutes);

// Note: Cost Drivers, Data Explorer, Resources, Data Quality, Optimization, and Reports
// can be added later by following the same pattern:
// - Create module folder with service, controller, and routes files
// - Import and mount routes here

export default router;
