import express from "express";
import dashboardRoutes from "./dashboard/dashboard.routes.js";

const router = express.Router();

router.use("/", dashboardRoutes);

export default router;

