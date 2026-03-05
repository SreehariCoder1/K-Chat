import express from "express";
import { getMessages } from "../controllers/messageController.js";
import { protectRoute } from "../utils/protectRoute.js";

const router = express.Router();

router.get("/:id", protectRoute, getMessages);

export default router;
