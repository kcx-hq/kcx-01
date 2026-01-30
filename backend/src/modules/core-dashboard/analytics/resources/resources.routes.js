import express from 'express';
import { getResources } from './resources.controller.js';

const router = express.Router();

// GET /api/analytics/resources/inventory?provider=AWS&service=EC2&region=us-east-1
router.get('/inventory', getResources);

export default router;







