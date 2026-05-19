const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const User = require("../models/User");

// POST /api/register
router.post("/register", register);

// POST /api/login
router.post("/login", login);

// GET /api/me
router.get("/me", protect, (req, res) => {
  res.json({ success: true, message: "Access granted", user: req.user });
});

// GET /api/verify-password-format/:email
router.get("/verify-password-format/:email", async (req, res) => {
  const user = await User.findOne({ email: req.params.email }).select("+password");
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.password.startsWith("$2")) {
    return res.json({ message: "Encrypted format" });
  }
  return res.json({ message: "Plain text" });
});

module.exports = router;
