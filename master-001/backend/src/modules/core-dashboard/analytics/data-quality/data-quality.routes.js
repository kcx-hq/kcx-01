import express from 'express';
import { getQualityAnalysis } from './data-quality.controller.js';

const router = express.Router();


// GET /api/quality/analysis?provider=AWS&service=EC2&region=us-east-1
router.get('/analysis', getQualityAnalysis);

export default router;

