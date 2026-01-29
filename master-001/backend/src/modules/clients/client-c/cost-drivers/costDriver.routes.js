/**
 * Client-C Cost Drivers Routes
 */

import express from 'express';
import {
  getCostDrivers,
  getDepartmentDrivers,
  getDriverDetails,
} from './costDrivers.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();

// All routes require authentication
router.use(decodeUser);

/**
 * GET /api/client-c/cost-drivers
 * Service-level cost drivers
 */
router.get('/', getCostDrivers);

/**
 * POST /api/client-c/cost-drivers/department
 * Department ownership drilldown
 */
router.post('/department', getDepartmentDrivers);

/**
 * POST /api/client-c/cost-drivers/details
 * Detailed analysis for a single driver
 */
router.post('/details', getDriverDetails);

export default router;
