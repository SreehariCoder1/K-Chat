import StickerRepository from "../repositories/StickerRepository.js";
import { v2 as cloudinary } from "cloudinary";

export const uploadSticker = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No sticker file provided" });
    }

    const { name, keywords, type } = req.body;

    if (!name || !type) {
      if (req.file && req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(400).json({ error: "Name and type are required" });
    }

    if (type !== "static" && type !== "animated") {
      if (req.file && req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(400).json({ error: "Invalid sticker type" });
    }

    // Convert keywords string to array
    const keywordsArray = keywords
      ? keywords
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k)
      : [];

    const stickerUrl = req.file.path; // multer-storage-cloudinary places the full URL here

    const newStickerPayload = {
      url: stickerUrl,
      name,
      keywords: keywordsArray,
      type,
      uploadedBy: req.user._id,
    };

    const savedSticker = await StickerRepository.saveSticker(newStickerPayload);

    res.status(201).json(savedSticker);
  } catch (error) {
    console.error("Error in uploadSticker controller:", error);
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (err) {
        console.error("Failed to delete cloud file", err);
      }
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStickers = async (req, res) => {
  try {
    const { query } = req.query;

    let stickers;
    if (query && query.trim() !== "") {
      stickers = await StickerRepository.searchStickers(query);
    } else {
      // Return popular or latest stickers if no query
      stickers = await StickerRepository.getDefaultStickers();
    }

    res.status(200).json(stickers);
  } catch (error) {
    console.error("Error in getStickers controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editSticker = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, keywords } = req.body;

    const sticker = await StickerRepository.getStickerById(id);

    if (!sticker) {
      return res.status(404).json({ error: "Sticker not found" });
    }

    if (sticker.uploadedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this sticker" });
    }

    // Convert keywords string to array if provided
    let keywordsArray = sticker.keywords;
    if (keywords !== undefined) {
      keywordsArray = keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k);
    }

    const updatedSticker = await StickerRepository.updateSticker(id, {
      name: name || sticker.name,
      keywords: keywordsArray,
    });

    res.status(200).json(updatedSticker);
  } catch (error) {
    console.error("Error in editSticker controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteSticker = async (req, res) => {
  try {
    const { id } = req.params;

    const sticker = await StickerRepository.getStickerById(id);

    if (!sticker) {
      return res.status(404).json({ error: "Sticker not found" });
    }

    if (sticker.uploadedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this sticker" });
    }

    // Remove file from Cloudinary
    try {
      const urlParts = sticker.url.split("/");
      const fileWithExt = urlParts[urlParts.length - 1];
      const folder = urlParts[urlParts.length - 2];
      const filename = fileWithExt.split(".")[0];

      const publicId = `${folder}/${filename}`;

      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error("Error deleting sticker from Cloudinary", err);
    }

    await StickerRepository.deleteSticker(id);

    // Also remove from users' favorites/recents
    await StickerRepository.removeStickerFromAllUsers(id);

    res.status(200).json({ message: "Sticker deleted successfully" });
  } catch (error) {
    console.error("Error in deleteSticker controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const favoriteStickers = await StickerRepository.getUserFavoriteStickers(
      req.user._id,
    );
    res.status(200).json(favoriteStickers);
  } catch (error) {
    console.error("Error in getFavorites controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await StickerRepository.getUserById(req.user._id);
    if (!user.favoriteStickers.includes(id)) {
      user.favoriteStickers.push(id);
      await StickerRepository.saveUser(user);
    }

    res.status(200).json({
      message: "Added to favorites",
      favoriteStickers: user.favoriteStickers,
    });
  } catch (error) {
    console.error("Error in addFavorite controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    await StickerRepository.removeFavoriteSticker(req.user._id, id);

    res.status(200).json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Error in removeFavorite controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRecents = async (req, res) => {
  try {
    const recentStickers = await StickerRepository.getUserRecentStickers(
      req.user._id,
    );
    res.status(200).json(recentStickers);
  } catch (error) {
    console.error("Error in getRecents controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addRecent = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await StickerRepository.getUserById(req.user._id);

    // Remove if it already exists to move it to the front
    user.recentStickers = user.recentStickers.filter(
      (sId) => sId.toString() !== id,
    );

    // Add to front
    user.recentStickers.unshift(id);

    // Keep only top 20
    if (user.recentStickers.length > 20) {
      user.recentStickers = user.recentStickers.slice(0, 20);
    }

    await StickerRepository.saveUser(user);

    res.status(200).json({
      message: "Added to recents",
      recentStickers: user.recentStickers,
    });
  } catch (error) {
    console.error("Error in addRecent controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyStickers = async (req, res) => {
  try {
    const stickers = await StickerRepository.getStickersByUserId(req.user._id);
    res.status(200).json(stickers);
  } catch (error) {
    console.error("Error in getMyStickers controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
