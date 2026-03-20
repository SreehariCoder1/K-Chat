import userRepository from "../repositories/UserRepository.js";

export const blockUser = async (req, res) => {
  try {
    const userId = req.user.id; // user who is blocking
    const { id: userToBlockId } = req.params; // user to be blocked

    if (userId === userToBlockId) {
      return res.status(400).json({ message: "You cannot block yourself." });
    }

    const userToBlock = await userRepository.findById(userToBlockId);
    if (!userToBlock) {
      return res.status(404).json({ message: "User not found." });
    }

    const currentUser = await userRepository.findById(userId);

    if (currentUser.blockedUsers.includes(userToBlockId)) {
      return res.status(400).json({ message: "User is already blocked." });
    }

    const updatedUser = await userRepository.blockUser(userId, userToBlockId);

    res.status(200).json({
      message: "User blocked successfully.",
      blockedUsers: updatedUser.blockedUsers,
    });
  } catch (error) {
    console.error("Error in blockUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const userId = req.user.id; // user who is unblocking
    const { id: userToUnblockId } = req.params; // user to be unblocked

    if (userId === userToUnblockId) {
      return res.status(400).json({ message: "You cannot unblock yourself." });
    }

    const userToUnblock = await userRepository.findById(userToUnblockId);
    if (!userToUnblock) {
      return res.status(404).json({ message: "User not found." });
    }

    const currentUser = await userRepository.findById(userId);

    if (!currentUser.blockedUsers.includes(userToUnblockId)) {
      return res.status(400).json({ message: "User is not blocked." });
    }

    const updatedUser = await userRepository.unblockUser(
      userId,
      userToUnblockId,
    );

    res.status(200).json({
      message: "User unblocked successfully.",
      blockedUsers: updatedUser.blockedUsers,
    });
  } catch (error) {
    console.error("Error in unblockUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const blockedUsersDetails =
      await userRepository.getBlockedUsersDetails(userId);
    res.status(200).json(blockedUsersDetails);
  } catch (error) {
    console.error("Error in getBlockedUsers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.status(200).json([]);
    }
    const userId = req.user.id;
    const results = await userRepository.searchUsers(q, userId);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error in searchUsers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: targetUserId } = req.params;

    if (userId === targetUserId) {
      return res.status(400).json({ message: "You cannot favorite yourself." });
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const currentUser = await userRepository.findById(userId);

    if (currentUser.favorites.includes(targetUserId)) {
      return res.status(400).json({ message: "User is already favorited." });
    }

    const updatedUser = await userRepository.addFavorite(userId, targetUserId);

    res.status(200).json({
      message: "User favorited successfully.",
      favorites: updatedUser.favorites,
    });
  } catch (error) {
    console.error("Error in addFavorite:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: targetUserId } = req.params;

    if (userId === targetUserId) {
      return res
        .status(400)
        .json({ message: "You cannot unfavorite yourself." });
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const currentUser = await userRepository.findById(userId);

    if (!currentUser.favorites.includes(targetUserId)) {
      return res.status(400).json({ message: "User is not favorited." });
    }

    const updatedUser = await userRepository.removeFavorite(
      userId,
      targetUserId,
    );

    res.status(200).json({
      message: "User unfavorited successfully.",
      favorites: updatedUser.favorites,
    });
  } catch (error) {
    console.error("Error in removeFavorite:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const favoritesDetails = await userRepository.getFavoritesDetails(userId);
    res.status(200).json(favoritesDetails);
  } catch (error) {
    console.error("Error in getFavorites:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
