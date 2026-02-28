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
}

export default new UserRepository();
