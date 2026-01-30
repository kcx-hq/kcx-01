import express from 'express';
import { getCostDrivers, getDriverDetails } from './cost-drivers.controller.js';

const router = express.Router();

// Test route to verify routing is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Drivers route is working!' });
});

// GET /api/drivers/analysis?provider=AWS&period=30&dimension=ServiceName&minChange=0&activeServiceFilter=All
router.get('/analysis', getCostDrivers);

// POST /api/drivers/details
router.post('/details', getDriverDetails);

export default router;

