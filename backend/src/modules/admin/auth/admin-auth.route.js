import express from "express";
import { signInAdmin, logoutAdmin } from "./admin-auth.controller.js";

const router = express.Router();

router.post("/signin", signInAdmin);
router.get("/logout", logoutAdmin);

export default router;
