/**
 * Analytics Routes
 * Main routes file for all analytics modules
 * Combines cost-analysis, cost-drivers, data-quality, and resources
 */

import express from 'express';
import costAnalysisRoutes from './cost-analysis/cost-analysis.routes.js';
import costDriversRoutes from './cost-drivers/cost-drivers.routes.js';
import dataQualityRoutes from './data-quality/data-quality.routes.js';
import resourcesRoutes from './resources/resources.routes.js';

const router = express.Router();

// Mount sub-routes
// GET /api/analytics/cost-analysis/analysis
// GET /api/analytics/cost-analysis/filters
router.use('/cost-analysis', costAnalysisRoutes);

// GET /api/analytics/cost-drivers/analysis
// POST /api/analytics/cost-drivers/details
router.use('/cost-drivers', costDriversRoutes);

// GET /api/analytics/data-quality/analysis
router.use('/data-quality', dataQualityRoutes);

// GET /api/analytics/resources/inventory
router.use('/resources', resourcesRoutes);

export default router;

