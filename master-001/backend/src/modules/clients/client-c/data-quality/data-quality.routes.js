/**
 * Client-C Data Quality Routes
 */

import express from 'express';
import { analyzeDataQuality } from './data-quality.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();

router.use(decodeUser);
router.get('/analyze', analyzeDataQuality);

export default router;
