import User from "../models/User.js";
import bcrypt from "bcryptjs"; // thuật toán hash (ngoài ra còn có SHA256 và MD5)
import { createError } from "../utils/error.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import dotenv from 'dotenv';
dotenv.config();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Tạo mk tạm ngẫu nhiên cho user google
const generateRandomPassword = () => {
  const randomPassword = Math.random().toString(36).slice(-8); // Tạo chuỗi ngẫu nhiên 8 ký tự
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(randomPassword, salt); // Mã hóa mật khẩu ngẫu nhiên
}

export const register = async (req, res, next) => {
  try {
    // Băm (hash) mật khẩu người dùng nhập vào
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const newUser = new User({
      ...req.body,
      password: hash,
    });

    await newUser.save();
    res.status(200).json({ message: "User registered successfully!" });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return next(createError(404, "User not found"));

    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordCorrect) return next(createError(400, "Wrong Password or Username"));

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    const { password, isAdmin, ...otherDetails } = user._doc;
    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 3600000,
      })
      .status(200)
      .json({ details: { ...otherDetails }, isAdmin });
  } catch (err) {
    next(err);
  }
};

export const google = async (req, res, next) => {
  try {
    const { token } = req.body; // Google ID token from the frontend

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload; // Extract user info

    // Check if the user already exists (by email or googleId)
    let user = await User.findOne({ $or: [{ email }, { googleId }] });
    const tempPassword = generateRandomPassword();

    if (!user) {
      // Create a new user if they don't exist
      user = new User({
        username: name || email.split("@")[0], // Use name or email prefix as username
        email,
        googleId,
        password: tempPassword, // No password for Google users
        isAdmin: false,
        isHotelier: [],
      });
      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    // Send the token and user details back to the frontend
    const { password, isAdmin, ...otherDetails } = user._doc;
    res
      .cookie("access_token", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 3600000,
      })
      .status(200)
      .json({ details: { ...otherDetails }, isAdmin });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.clearCookie("access_token").status(200).json({ message: "Logged out successfully" });
};