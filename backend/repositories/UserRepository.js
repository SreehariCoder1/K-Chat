import User from "../models/User.js";

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
}

export default new UserRepository();
