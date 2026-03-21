import express from "express";
import {
  blockUser,
  unblockUser,
  getBlockedUsers,
  searchUsers,
  addFavorite,
  removeFavorite,
  getFavorites,
  deleteAccount,
} from "../controllers/userController.js";
import { protectRoute } from "../utils/protectRoute.js";

const router = express.Router();

router.post("/block/:id", protectRoute, blockUser);
router.post("/unblock/:id", protectRoute, unblockUser);
router.get("/blocked", protectRoute, getBlockedUsers);
router.get("/search", protectRoute, searchUsers);
router.post("/favorite/:id", protectRoute, addFavorite);
router.post("/unfavorite/:id", protectRoute, removeFavorite);
router.get("/favorites", protectRoute, getFavorites);
router.delete("/me", protectRoute, deleteAccount);

export default router;
