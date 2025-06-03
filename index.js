const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();
const cors = require("cors");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");

dbConnect();
// Middleware
app.use(
  cors({
    origin: true, // Frontend URL
    credentials: true,
  })
);
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: "photo-app-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      // maxAge: 30 * 60 * 1000 // Tùy chọn: 30 phút
    },
  })
);

// Serve static images
app.use("/images", express.static(path.join(__dirname, "images")));

// Middleware kiểm tra đăng nhập
const requireLogin = (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Routes
app.use("/api/user", UserRouter);
app.use("/api/photo", PhotoRouter);

// Admin routes cho login/logout
app.post("/admin/login", async (req, res) => {
  const { login_name, password } = req.body;

  try {
    const User = require("./db/userModel");
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
    console.log("X. Đã xảy ra lỗi trong khối catch:", error); // LOG LỖI
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin/logout", (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).json({ error: "No user logged in" });
  }

  req.session.destroy();
  res.json({ message: "Logged out successfully" });
});

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "images");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

// Upload photo endpoint
app.post(
  "/photos/new",
  requireLogin,
  upload.single("uploadedphoto"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const Photo = require("./db/photoModel");
      const newPhoto = new Photo({
        file_name: req.file.filename,
        user_id: req.session.user_id,
        comments: [],
      });

      await newPhoto.save();
      res.json({ message: "Photo uploaded successfully", photo: newPhoto });
    } catch (error) {
      res.status(500).json({ error: "Failed to save photo" });
    }
  }
);

// Add comment endpoint
app.post("/commentsOfPhoto/:photo_id", requireLogin, async (req, res) => {
  const { comment } = req.body;
  const { photo_id } = req.params;

  if (!comment || comment.trim() === "") {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    const Photo = require("./db/photoModel");
    const photo = await Photo.findById(photo_id);

    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }

    const newComment = {
      comment: comment.trim(),
      user_id: req.session.user_id,
      date_time: new Date(),
    };

    photo.comments.push(newComment);
    await photo.save();

    res.json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

app.get("/", (request, response) => {
  response.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port 8081");
});
