import express from 'express';
import { getOverview, getTrend, getDrilldown } from './department-cost.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();
router.use(decodeUser);

router.get('/overview', getOverview);
router.get('/trend', getTrend);
router.get('/drilldown', getDrilldown);

export default router;
