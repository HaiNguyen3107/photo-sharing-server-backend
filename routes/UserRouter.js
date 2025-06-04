const express = require("express");
const User = require("../db/userModel");
const router = express.Router();

// Middleware to check login
const requireLogin = (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// register
router.post("/", async (req, res) => {
  const {
    login_name,
    password,
    first_name,
    last_name,
    location,
    description,
    occupation,
  } = req.body;

  if (!login_name || !password || !first_name || !last_name) {
    return res.status(400).json({
      error: "login_name, password, first_name, and last_name are required",
    });
  }

  if (
    password.trim() === "" ||
    first_name.trim() === "" ||
    last_name.trim() === ""
  ) {
    return res
      .status(400)
      .json({ error: "password, first_name, and last_name cannot be empty" });
  }

  try {
    const existingUser = await User.findOne({ login_name: login_name });
    if (existingUser) {
      return res.status(400).json({ error: "login_name already exists" });
    }

    const newUser = new User({
      login_name,
      password,
      first_name,
      last_name,
      location: location || "",
      description: description || "",
      occupation: occupation || "",
    });

    await newUser.save();

    res.json({
      message: "User registered successfully",
      login_name: newUser.login_name,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Get user list
router.get("/list", requireLogin, async (req, res) => {
  try {
    const users = await User.find({}).select("_id first_name last_name");

    if (!users) {
      return res
        .status(404)
        .json({ error: "No users found or database error" });
    }
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch users due to server error" });
  }
});

// Get user by id
router.get("/:id", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "_id first_name last_name location description occupation"
    );
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
