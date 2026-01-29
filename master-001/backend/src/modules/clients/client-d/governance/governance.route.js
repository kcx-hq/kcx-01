import express from 'express';
import { getClientDCompliance } from './governance.controller.js';

const router = express.Router();

// GET /api/client-d/governance/compliance
router.get('/compliance', getClientDCompliance);

export default router;
