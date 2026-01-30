/**
 * Governance Routes
 */

import express from 'express';
import { getSummary, getCompliance, getAccounts, updateAccountOwner } from './governance.controller.js';

const router = express.Router();

router.get('/summary', getSummary);
router.get('/compliance', getCompliance);
router.get('/accounts', getAccounts);
router.put('/accounts/:accountId/owner', updateAccountOwner);

export default router;

