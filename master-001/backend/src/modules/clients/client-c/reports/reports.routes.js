/**
 * Client-C Reports Routes
 */

import express from 'express';
import { getSummary, getTopServices, getMonthlySpend } from './reports.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();

router.use(decodeUser);
router.get('/summary', getSummary);
router.get('/top-services', getTopServices);
router.get('/monthly-spend', getMonthlySpend);

export default router;
