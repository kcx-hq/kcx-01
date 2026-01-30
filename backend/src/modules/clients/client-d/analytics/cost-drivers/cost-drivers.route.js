import express from 'express';
import { getClientDCostDrivers, getClientDDriverDetails } from './cost-drivers.controller.js';

const router = express.Router();



// GET /api/drivers/analysis?provider=AWS&period=30&dimension=ServiceName&minChange=0&activeServiceFilter=All
router.get('/analysis', getClientDCostDrivers);

// POST /api/drivers/details
router.post('/details', getClientDDriverDetails);

export default router;

