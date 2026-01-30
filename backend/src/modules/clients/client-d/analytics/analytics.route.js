import express from 'express';
import costAnalysisRoutes from './cost-analysis/cost-analysis.route.js';
import costDriversRoutes from './cost-drivers/cost-drivers.route.js';
import dataQualityRoutes from './data-quality/data-quality.route.js';
import resourcesRoutes from './resources/resources.route.js';

const router = express.Router();

// All dashboard routes require login

// GET /api/dashboard/overview?provider=AWS&service=EC2
router.use('/cost-analysis', costAnalysisRoutes);
router.use('/cost-drivers', costDriversRoutes);
router.use('/data-quality', dataQualityRoutes);
router.use('/resources', resourcesRoutes);
export default router;