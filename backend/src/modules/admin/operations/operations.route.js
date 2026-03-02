import express from "express";
import { getUpload, getUploads } from "./operations.controller.js";

const router = express.Router();

router.get("/uploads", getUploads);
router.get("/uploads/:id", getUpload);

export default router;
