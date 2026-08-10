const express = require("express");
const { uploadVideo, uploadImage } = require("../config/upload");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/video", protect, restrictTo("teacher", "admin"), uploadVideo.single("video"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: "مفيش فيديو اتبعت" });
    res.json({ localFilename: req.file.filename });
  }
);

router.post(
  "/image", protect, restrictTo("teacher", "admin"), uploadImage.single("image"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: "مفيش صورة اتبعت" });
    res.json({ localFilename: req.file.filename });
  }
);

module.exports = router;
