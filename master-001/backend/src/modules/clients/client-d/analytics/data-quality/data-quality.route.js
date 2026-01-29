import express from 'express';
import { getClientDQualityAnalysis  } from './data-quality.controller.js';

const router = express.Router();


// GET /api/drivers/analysis?provider=AWS&period=30&dimension=ServiceName&minChange=0&activeServiceFilter=All
router.get('/analysis', getClientDQualityAnalysis);



export default router;

