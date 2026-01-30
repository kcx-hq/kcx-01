/**
 * Client-C Optimization Routes
 */

import express from 'express';
import { getRecommendations, getOpportunities } from './optimization.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();

router.use(decodeUser);
router.get('/recommendations', getRecommendations);
router.get('/opportunities', getOpportunities);

export default router;
