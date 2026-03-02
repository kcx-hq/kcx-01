import express from "express";
import { decodeAdmin } from "./middlewares/decodeAdmin.js";
import { requireAdmin } from "./middlewares/requireAdmin.js";
import overviewRoutes from "./overview/overview.route.js";
import usersRoutes from "./users/users.route.js";
import inquiriesRoutes from "./inquiries/inquiries.route.js";
import activityLogsRoutes from "./activity-logs/activity-logs.route.js";
import operationsRoutes from "./operations/operations.route.js";

const router = express.Router();

router.use(decodeAdmin, requireAdmin);

router.get("/health", (req, res) => {
  return res.ok({ ok: true });
});

router.use("/overview", overviewRoutes);
router.use("/users", usersRoutes);
router.use("/inquiries", inquiriesRoutes);
router.use("/activity-logs", activityLogsRoutes);
router.use("/operations", operationsRoutes);

export default router;
