import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { protectRoute } from "../utils/protectRoute.js";
import {
  uploadSticker,
  getStickers,
  editSticker,
  deleteSticker,
  getFavorites,
  addFavorite,
  removeFavorite,
  getRecents,
  addRecent,
  getMyStickers,
} from "../controllers/stickerController.js";

const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage config for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "k-chat-stickers",
    resource_type: "auto",
  },
});

// Multer file filter and limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024, // max limit 500KB.
  },
  fileFilter: (req, file, cb) => {
    console.log(
      "Multer received file:",
      file.originalname,
      "Mimetype:",
      file.mimetype,
    );
    if (
      file.mimetype.includes("webp") ||
      file.originalname.endsWith(".webp") ||
      file.mimetype === "application/octet-stream"
    ) {
      cb(null, true);
    } else {
      console.log("Multer rejected file:", file.mimetype);
      cb(new Error("Only .webp format is allowed!"), false);
    }
  },
});

// Wrapper for custom error handling
const uploadMiddleware = (req, res, next) => {
  console.log("Upload middleware hit. req.body:", req.body);
  upload.single("sticker")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      return res
        .status(400)
        .json({ error: `File upload error: ${err.message}` });
    } else if (err) {
      console.error("Standard error during upload:", err);
      return res.status(400).json({ error: err.message });
    }

    console.log("File parsed by multer:", req.file ? "Yes" : "No");
    if (req.file) {
      const type = req.body.type;
      const size = req.file.size;

      let cleanupNeeded = false;
      let errorMessage = "";

      if (type === "static" && size > 100 * 1024) {
        cleanupNeeded = true;
        errorMessage = "Static stickers must be under 100KB";
      } else if (type === "animated" && size > 500 * 1024) {
        cleanupNeeded = true;
        errorMessage = "Animated stickers must be under 500KB";
      }

      if (cleanupNeeded) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
        } catch (err) {
          console.error("Failed to destroy large cloudinary upload", err);
        }
        return res.status(400).json({ error: errorMessage });
      }
    } else {
      console.log("req.file is undefined after upload block");
    }

    next();
  });
};

/* --- Routes --- */

// Search/Get all public stickers
router.get("/", protectRoute, getStickers);

// Upload a new sticker
router.post("/upload", protectRoute, uploadMiddleware, uploadSticker);

// Get uploaded stickers
router.get("/my-uploads", protectRoute, getMyStickers);

// Favorites
router.get("/favorites", protectRoute, getFavorites);
router.post("/favorites/:id", protectRoute, addFavorite);
router.delete("/favorites/:id", protectRoute, removeFavorite);

// Recents
router.get("/recents", protectRoute, getRecents);
router.post("/recents/:id", protectRoute, addRecent);

// Edit/Delete my sticker
router.put("/:id", protectRoute, editSticker);
router.delete("/:id", protectRoute, deleteSticker);

export default router;
