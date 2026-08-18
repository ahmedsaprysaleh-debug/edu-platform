const express = require("express");
const cloudinary = require("../config/cloudinary");
const { protect, restrictTo } = require("../middleware/auth");
const router = express.Router();

// بيرجع توقيع (signature) صغير عشان الفرونت إند يرفع الفيديو مباشرة لـ Cloudinary
// من غير ما يعدي على الباك إند بتاعنا (عشان نتفادى حد الـ 4.5MB بتاع Vercel)
router.get("/video-signature", protect, restrictTo("teacher", "admin"), (req, res) => {
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = {
    timestamp,
    folder: "edu-platform/videos",
    type: "authenticated",
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: "edu-platform/videos",
  });
});

module.exports = router;
