import express from "express";
import governanceRoutes from "../governance/governance.routes.js";
import dataQualityRoutes from "../analytics/data-quality/data-quality.routes.js";

const router = express.Router();

// Unified entrypoint for governance and data quality domain endpoints.
router.use("/governance", governanceRoutes);
router.use("/data-quality", dataQualityRoutes);

export default router;
