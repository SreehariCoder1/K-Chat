import express from "express";
import {
  getMessages,
  getChatHistory,
} from "../controllers/messageController.js";
import { protectRoute } from "../utils/protectRoute.js";

const router = express.Router();

router.get("/history", protectRoute, getChatHistory);
router.get("/:id", protectRoute, getMessages);

export default router;
