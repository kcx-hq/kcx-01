import express from "express";
import {
  getInquiries,
  getInquiry,
  updateStatus,
  relayToBoss,
  bulkStatusUpdate,
  removeInquiry,
  bulkRemoveInquiries,
} from "./inquiries.controller.js";

const router = express.Router();

router.get("/", getInquiries);
router.patch("/bulk/status", bulkStatusUpdate);
router.delete("/bulk/remove", bulkRemoveInquiries);
router.get("/:id", getInquiry);
router.patch("/:id/status", updateStatus);
router.post("/:id/relay", relayToBoss);
router.delete("/:id", removeInquiry);

export default router;
