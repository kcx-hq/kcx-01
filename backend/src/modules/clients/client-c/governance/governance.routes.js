import express from 'express';
import { getSummary, getCompliance, getAccounts, updateAccountOwner } from './governance.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();
router.use(decodeUser);

router.get('/summary', getSummary);
router.get('/compliance', getCompliance);
router.get('/accounts', getAccounts);
router.put('/accounts/:accountId/owner', updateAccountOwner);

export default router;
