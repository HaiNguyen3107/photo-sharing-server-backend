const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const router = express.Router();

// Middleware to check login
const requireLogin = (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};
// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "../images");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });
// Get all photos
router.get("/", requireLogin, async (req, res) => {
  try {
    const photos = await Photo.find({});
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// Get photos of user
router.get("/photosOfUser/:id", requireLogin, async (req, res) => {
  try {
    const photos = await Photo.find({ user_id: req.params.id });
    const processedPhotos = [];
    for (let photo of photos) {
      const photoData = {
        _id: photo._id,
        user_id: photo.user_id,
        file_name: photo.file_name,
        date_time: photo.date_time,
        comments: [],
      };
      for (let comment of photo.comments) {
        const commentUser = await User.findById(comment.user_id).select(
          "_id first_name last_name"
        );

        if (commentUser) {
          photoData.comments.push({
            _id: comment._id,
            comment: comment.comment,
            date_time: comment.date_time,
            user: {
              _id: commentUser._id,
              first_name: commentUser.first_name,
              last_name: commentUser.last_name,
            },
          });
        }
      }

      processedPhotos.push(photoData);
    }

    res.json(processedPhotos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user photos" });
  }
});

// Upload photo endpoint
router.post(
  "/photos/new",
  requireLogin,
  upload.single("uploadedphoto"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
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
router.post("/commentsOfPhoto/:photo_id", requireLogin, async (req, res) => {
  const { comment } = req.body;
  const { photo_id } = req.params;

  if (!comment || comment.trim() === "") {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
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
module.exports = router;
