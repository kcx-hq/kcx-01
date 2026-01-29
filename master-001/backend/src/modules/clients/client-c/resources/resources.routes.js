import express from 'express';
import { getClientCResources } from './resources.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();

router.use(decodeUser);

// GET /api/client-c/resources/inventory
router.get('/inventory', getClientCResources);

export default router;
