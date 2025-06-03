const express = require("express");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const router = express.Router();

// Middleware kiểm tra đăng nhập
const requireLogin = (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Lấy tất cả photos (chỉ khi đã đăng nhập)
router.get("/", requireLogin, async (req, res) => {
  try {
    const photos = await Photo.find({});
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// Lấy photos của user cụ thể
router.get("/user/:id", requireLogin, async (req, res) => {
  try {
    const photos = await Photo.find({ user_id: req.params.id });
    
    // Populate thông tin user cho comments
    const populatedPhotos = [];
    for (let photo of photos) {
      const photoObj = photo.toObject();
      const commentsWithUser = [];
      
      for (let comment of photoObj.comments) {
        const user = await User.findById(comment.user_id, '-password');
        commentsWithUser.push({
          ...comment,
          user: user
        });
      }
      
      photoObj.comments = commentsWithUser;
      populatedPhotos.push(photoObj);
    }
    
    res.json(populatedPhotos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user photos" });
  }
});

module.exports = router;