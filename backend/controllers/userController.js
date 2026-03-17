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
