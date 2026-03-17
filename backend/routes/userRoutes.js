import express from "express";
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  searchUsers,
} from "../controllers/userController.js";
import { protectRoute } from "../utils/protectRoute.js";

const router = express.Router();

router.post("/block/:id", protectRoute, blockUser);
router.post("/unblock/:id", protectRoute, unblockUser);
router.get("/blocked", protectRoute, getBlockedUsers);
router.get("/search", protectRoute, searchUsers);

export default router;
