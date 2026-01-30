import express from "express";
import { getCapabilities } from "./capabilities.controller.js";

const router = express.Router();

router.get("/", getCapabilities);

export default router;
