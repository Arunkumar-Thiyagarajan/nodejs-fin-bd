const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// Registration
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const user = new User({ firstName, lastName, email, password });
    await user.save();

    // Send activation email
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const activationLink = `${process.env.BASE_URL}/api/auth/activate/${token}`;
    await sendEmail(email, "Activate your account", `Click here to activate: ${activationLink}`);

    res.status(201).json({ message: "Registration successful. Check your email to activate." });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
});

// Activate Account
router.get("/activate/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.isActive = true;
    await user.save();

    res.json({ message: "Account activated. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Error activating account" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    if (!user.isActive) return res.status(403).json({ message: "Account not activated" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
});

module.exports = router;
