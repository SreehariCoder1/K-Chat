import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import userRepository from "../repositories/UserRepository.js";
import { sendEmail } from "../utils/sendEmail.js";

export const register = async (req, res) => {
  try {
    const { username, gender, age, district, email, password, captchaToken } =
      req.body;

    // Validation
    if (
      !username ||
      !gender ||
      !age ||
      !district ||
      !email ||
      !password ||
      !captchaToken
    ) {
      return res
        .status(400)
        .json({ message: "All fields and CAPTCHA are required" });
    }

    if (username.length < 3 || username.length > 30) {
      return res
        .status(400)
        .json({ message: "Username must be between 3 and 30 characters" });
    }

    // Verify reCAPTCHA token
    const verifyCaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"}&response=${captchaToken}`;
    const captchaResponse = await fetch(verifyCaptchaUrl, { method: "POST" });
    const captchaData = await captchaResponse.json();

    if (!captchaData.success) {
      return res.status(400).json({ message: "Invalid CAPTCHA token" });
    }

    // Check if user exists
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const newUser = await userRepository.createUser({
      username,
      gender,
      age,
      district,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    const message = `
      <h1>Verify Your Email</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verifyUrl}" clicktracking="off">${verifyUrl}</a>
      <p>This link is valid for 24 hours.</p>
    `;

    try {
      await sendEmail({
        to: newUser.email,
        subject: "Verify Your Email Address",
        html: message,
      });

      res.status(201).json({
        message:
          "User registered successfully. Please check your email to verify your account.",
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      });
    } catch (error) {
      console.error("Email sending error:", error);
      // Even if email fails, user is created but unverified.
      res.status(500).json({
        message:
          "User created, but there was an error sending the verification email.",
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please provide credentials" });
    }

    // Find user by email or username
    let user = await userRepository.findByEmail(identifier);
    if (!user) {
      user = await userRepository.findByUsername(identifier);
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email address before logging in.",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        district: user.district,
        blockedUsers: user.blockedUsers || [],
        favorites: user.favorites || [],
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

export const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        district: user.district,
        blockedUsers: user.blockedUsers || [],
        favorites: user.favorites || [],
      },
    });
  } catch (error) {
    res.status(401).json({ message: "Not authenticated" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await userRepository.findByVerificationToken(token);

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error during email verification" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Prevent email enumeration
      return res.status(200).json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hr

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `
      <h1>Password Reset Request</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
      <p>This link is valid for 1 hour.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset Request",
        html: message,
      });

      res.status(200).json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password email error:", error);

      user.resetPasswordToken = undefined;
      user.resetPasswordExpiresAt = undefined;
      await user.save();

      return res.status(500).json({ message: "Error sending email" });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Invalid password format" });
    }

    // Hash incoming token for comparison
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userRepository.findByResetPasswordToken(hashedToken);

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear reset tokens
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};
