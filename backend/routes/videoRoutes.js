const express = require("express");
const {
  getVideoToken,
  streamVideo,
  markVideoWatched,
  getQuestions,
  addQuestion,
  getComments,
  addComment,
  replyToComment,
} = require("../controllers/videoController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.post("/:videoId/token", protect, getVideoToken);
router.post("/:videoId/watched", protect, markVideoWatched);
router.get("/stream/:videoId", streamVideo);

// الأسئلة
router.get("/:videoId/questions", getQuestions);
router.post("/:videoId/questions", protect, addQuestion);

// التعليقات
router.get("/:videoId/comments", getComments);
router.post("/:videoId/comments", protect, addComment);
router.post("/comments/:commentId/reply", protect, restrictTo("teacher", "admin"), replyToComment);

module.exports = router;