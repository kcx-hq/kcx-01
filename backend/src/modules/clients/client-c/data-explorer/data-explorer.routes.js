/**
 * Client-C Data Explorer Routes
 */

import express from 'express';
import { 
  getDataExplorer, 
  exportDataExplorerCSV,
  getAvailableDepartments
} from './data-explorer.controller.js';
import { decodeUser } from '../../../../middlewares/decodeUser.js';

const router = express.Router();

// All routes require authentication
router.use(decodeUser);

router.get('/', getDataExplorer);
router.get('/export-csv', exportDataExplorerCSV);
router.get('/departments', getAvailableDepartments);

export default router;
