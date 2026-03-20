import Sticker from "../models/Sticker.js";
import User from "../models/User.js";

class StickerRepository {
  async saveSticker(stickerData) {
    const sticker = new Sticker(stickerData);
    return await sticker.save();
  }

  async searchStickers(query) {
    return await Sticker.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { keywords: { $elemMatch: { $regex: query, $options: "i" } } },
      ],
    }).limit(50);
  }

  async getDefaultStickers() {
    return await Sticker.find().sort({ createdAt: -1 }).limit(50);
  }

  async getStickerById(id) {
    return await Sticker.findById(id);
  }

  async updateSticker(id, updateData) {
    return await Sticker.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
    });
  }

  async deleteSticker(id) {
    return await Sticker.findByIdAndDelete(id);
  }

  async getStickersByUserId(userId) {
    return await Sticker.find({ uploadedBy: userId }).sort({ createdAt: -1 });
  }

  // User-Sticker relation methods
  async removeStickerFromAllUsers(stickerId) {
    return await User.updateMany(
      {},
      { $pull: { favoriteStickers: stickerId, recentStickers: stickerId } },
    );
  }

  async getUserFavoriteStickers(userId) {
    const user = await User.findById(userId).populate("favoriteStickers");
    return user ? user.favoriteStickers : [];
  }

  async getUserById(userId) {
    return await User.findById(userId);
  }

  async removeFavoriteSticker(userId, stickerId) {
    return await User.findByIdAndUpdate(userId, {
      $pull: { favoriteStickers: stickerId },
    });
  }

  async getUserRecentStickers(userId) {
    const user = await User.findById(userId).populate("recentStickers");
    return user ? user.recentStickers : [];
  }

  async saveUser(user) {
    return await user.save();
  }
}

export default new StickerRepository();
