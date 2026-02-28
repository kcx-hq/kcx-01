import express from "express";
import { getUsers, getUser, updateStatus, updateRole, notifyUnverified, removeUser } from "./users.controller.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/:id", getUser);
router.patch("/:id/status", updateStatus);
router.patch("/:id/role", updateRole);
router.post("/:id/notify-unverified", notifyUnverified);
router.delete("/:id", removeUser);

export default router;
