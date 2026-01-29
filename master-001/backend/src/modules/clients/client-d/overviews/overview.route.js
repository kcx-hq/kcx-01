import express from 'express';
import { getClientDOverview ,exportClientDDataExplorerCSV  , getClientDDataExplorer} from './overview.controller.js';
import { getFilters } from '../../../core-dashboard/overviews/overview.controller.js';

const router = express.Router();

// GET /api/dashboard/overview?provider=AWS&service=EC2
router.get('/', getClientDOverview);
router.get('/filters', getFilters); // core controller reused
router.get('/data-explorer', getClientDDataExplorer);
router.get('/data-explorer/export-csv', exportClientDDataExplorerCSV);

export default router;