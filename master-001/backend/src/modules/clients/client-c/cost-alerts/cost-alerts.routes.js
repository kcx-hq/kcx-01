import express from 'express';
import { getAlerts, getBudgetStatus, createRule } from './cost-alerts.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();
router.use(decodeUser);

router.get('/alerts', getAlerts);
router.get('/budget-status', getBudgetStatus);
router.post('/rules', createRule);

export default router;
