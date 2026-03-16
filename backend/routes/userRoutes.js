import express from "express";
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
} from "../controllers/userController.js";
import { protectRoute } from "../utils/protectRoute.js";

const router = express.Router();

router.post("/block/:id", protectRoute, blockUser);
router.post("/unblock/:id", protectRoute, unblockUser);
router.get("/blocked", protectRoute, getBlockedUsers);

export default router;
