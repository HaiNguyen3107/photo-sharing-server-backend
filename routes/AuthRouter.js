const express = require("express");
const User = require("../db/userModel");
const router = express.Router();
// Login
router.post("/login", async (req, res) => {
  const { login_name, password } = req.body;

  try {
    const user = await User.findOne({ login_name: login_name });

    if (!user || user.password !== password) {
      return res.status(400).json({ error: "Invalid login credentials" });
    }
    req.session.user_id = user._id;

    res.json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      login_name: user.login_name,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).json({ error: "No user logged in" });
  }
  req.session.destroy();
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
