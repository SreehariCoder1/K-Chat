import express from "express";
import {
  getMessages,
  getChatHistory,
  deleteHistory,
} from "../controllers/messageController.js";
import { protectRoute } from "../utils/protectRoute.js";

const router = express.Router();

router.get("/history", protectRoute, getChatHistory);
router.delete("/history/:id", protectRoute, deleteHistory);
router.get("/:id", protectRoute, getMessages);

export default router;
