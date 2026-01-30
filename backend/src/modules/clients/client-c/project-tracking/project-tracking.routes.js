import express from 'express';
import { getOverview, getBurnRate, compareBudget } from './project-tracking.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();
router.use(decodeUser);

router.get('/overview', getOverview);
router.get('/burn-rate', getBurnRate);
router.get('/budget-comparison', compareBudget);
router.post('/budget-comparison', compareBudget);

export default router;
