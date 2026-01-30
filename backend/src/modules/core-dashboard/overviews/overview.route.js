import express from 'express';
import { getOverview, getAnomalies, getFilters, getDataExplorer, exportDataExplorerCSV } from './overview.controller.js';

const router = express.Router();

// GET /api/dashboard/overview?provider=AWS&service=EC2
router.get('/', getOverview);
router.get('/anomalies', getAnomalies);
router.get('/filters', getFilters);
router.get('/data-explorer', getDataExplorer);
router.get('/data-explorer/export-csv', exportDataExplorerCSV);

export default router;