const express = require("express");
const User = require("../db/userModel");
const router = express.Router();

// Middleware kiểm tra đăng nhập
const requireLogin = (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Đăng ký user mới
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

  // Kiểm tra các trường bắt buộc
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
    // Kiểm tra login_name đã tồn tại chưa
    const existingUser = await User.findOne({ login_name: login_name });
    if (existingUser) {
      return res.status(400).json({ error: "login_name already exists" });
    }

    // Tạo user mới
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

// Lấy danh sách users (chỉ khi đã đăng nhập)
router.get("/list", requireLogin, async (req, res) => {
  try {
    const users = await User.find({}, "-password");

    if (!users) {
      console.log("UserRouter: User.find() trả về null hoặc undefined");
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

// Lấy thông tin user theo ID
router.get("/:id", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id, "-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
