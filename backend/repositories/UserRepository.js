import User from "../models/User.js";
import mongoose from "mongoose";

class UserRepository {
  async findByEmail(email) {
    return await User.findOne({ email });
  }

  async findByUsername(username) {
    return await User.findOne({ username });
  }

  async findByVerificationToken(token) {
    return await User.findOne({
      verificationToken: token,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });
  }

  async findById(id) {
    return await User.findById(id).select("-password");
  }

  async findByResetPasswordToken(token) {
    return await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });
  }

  async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async blockUser(actingUserId, targetUserId) {
    const user = await this.findById(actingUserId);
    if (!user) throw new Error("User not found");

    if (!user.blockedUsers.includes(targetUserId)) {
      user.blockedUsers.push(targetUserId);
      await user.save();
    }
    return user;
  }

  async unblockUser(actingUserId, targetUserId) {
    const user = await this.findById(actingUserId);
    if (!user) throw new Error("User not found");

    if (user.blockedUsers.includes(targetUserId)) {
      user.blockedUsers = user.blockedUsers.filter(
        (id) => id.toString() !== targetUserId.toString(),
      );
      await user.save();
    }
    return user;
  }

  async getBlockedUsersDetails(userId) {
    const user = await User.findById(userId).populate({
      path: "blockedUsers",
      select: "username gender age district _id",
    });
    return user ? user.blockedUsers : [];
  }

  async addFavorite(actingUserId, targetUserId) {
    const user = await this.findById(actingUserId);
    if (!user) throw new Error("User not found");

    if (!user.favorites.includes(targetUserId)) {
      user.favorites.push(targetUserId);
      await user.save();
    }
    return user;
  }

  async removeFavorite(actingUserId, targetUserId) {
    const user = await this.findById(actingUserId);
    if (!user) throw new Error("User not found");

    if (user.favorites.includes(targetUserId)) {
      user.favorites = user.favorites.filter(
        (id) => id.toString() !== targetUserId.toString(),
      );
      await user.save();
    }
    return user;
  }

  async getFavoritesDetails(userId) {
    const user = await User.findById(userId).populate({
      path: "favorites",
      select: "username gender age district _id",
    });
    return user ? user.favorites : [];
  }

  async searchUsers(query, currentUserId) {
    if (!query) return [];

    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    const safeQuery = escapeRegExp(query);
    const regexQuery = new RegExp(safeQuery, "i");
    const isNum = !isNaN(query) && query.trim() !== "";
    const numQuery = isNum ? Number(query) : null;

    const matchConditions = [
      { username: regexQuery },
      { gender: regexQuery },
      { district: regexQuery },
    ];

    if (isNum) {
      matchConditions.push({ age: numQuery });
    }

    const pipeline = [
      {
        $match: {
          $and: [
            { _id: { $ne: new mongoose.Types.ObjectId(currentUserId) } },
            { $or: matchConditions },
          ],
        },
      },
      {
        $addFields: {
          searchScore: {
            $add: [
              {
                $cond: [
                  { $regexMatch: { input: "$username", regex: regexQuery } },
                  100,
                  0,
                ],
              },
              {
                $cond: [
                  { $regexMatch: { input: "$gender", regex: regexQuery } },
                  50,
                  0,
                ],
              },
              {
                $cond: [
                  { $regexMatch: { input: "$district", regex: regexQuery } },
                  25,
                  0,
                ],
              },
              isNum ? { $cond: [{ $eq: ["$age", numQuery] }, 10, 0] } : 0,
            ],
          },
        },
      },
      { $sort: { searchScore: -1 } },
      { $limit: 50 },
      {
        $project: {
          username: 1,
          gender: 1,
          age: 1,
          district: 1,
          _id: 1,
        },
      },
    ];

    const sortedUsers = await User.aggregate(pipeline);
    return sortedUsers;
  }

  async deleteUser(userId) {
    return await User.findByIdAndDelete(userId);
  }
}

export default new UserRepository();
