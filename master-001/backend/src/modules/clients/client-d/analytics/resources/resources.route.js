import express from 'express';
import { getClientDResources  } from './resources.controller.js';

const router = express.Router();

// GET /api/drivers/analysis?provider=AWS&period=30&dimension=ServiceName&minChange=0&activeServiceFilter=All
router.get('/inventory', getClientDResources);

export default router;

