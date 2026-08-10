const express = require("express");
const { getVideoToken, streamVideo, markVideoWatched } = require("../controllers/videoController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/:videoId/token", protect, getVideoToken);
router.post("/:videoId/watched", protect, markVideoWatched);
router.get("/stream/:videoId", streamVideo); // التوكن نفسه هو وسيلة التحقق هنا، مش auth header

module.exports = router;