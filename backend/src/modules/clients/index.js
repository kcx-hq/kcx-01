import { decodeUser } from "../../middlewares/decodeUser.js";
import clientCRoutes from "./client-c/client-c.routes.js";
import clientDRoutes from "./client-d/client-d.routes.js";
import clientJRoutes from "./client-j/client-j.routes.js";

import express from "express";

const router = express.Router();

router.use("/client-c", decodeUser, clientCRoutes);
router.use("/client-d/dashboard", decodeUser, clientDRoutes);
router.use("/client-j/dashboard", decodeUser, clientJRoutes);

export default router;
