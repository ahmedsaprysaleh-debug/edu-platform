const express = require("express");
const {
  createCourse, getCourses, getCourseById, updateCourse, deleteCourse,
  addVideo, updateVideo, deleteVideo, getCourseVideos,
  enrollFreeCourse, getMyCourses, addVideoQuestion, getCourseExams // ← ضفنا دي هنا
} = require("../controllers/courseController");
const { protect, restrictTo } = require("../middleware/auth");
const { courseRules, checkValidation } = require("../middleware/validators");

const router = express.Router();

router.get("/", getCourses);
router.get("/my", protect, getMyCourses);
router.post("/:id/enroll", protect, restrictTo("student"), enrollFreeCourse);
router.get("/:id", getCourseById);
router.post("/", protect, restrictTo("teacher", "admin"), courseRules, checkValidation, createCourse);
router.patch("/:id", protect, restrictTo("teacher", "admin"), updateCourse);
router.delete("/:id", protect, restrictTo("teacher", "admin"), deleteCourse);

router.post("/:courseId/videos", protect, restrictTo("teacher", "admin"), addVideo);
router.get("/:courseId/videos", protect, getCourseVideos);
router.patch("/:courseId/videos/:videoId", protect, restrictTo("teacher", "admin"), updateVideo);
router.delete("/:courseId/videos/:videoId", protect, restrictTo("teacher", "admin"), deleteVideo);
// مسار إضافة سؤال على فيديو معين
router.post("/videos/:videoId/questions", protect, addVideoQuestion);
// مسار جلب امتحانات الكورس
router.get("/:courseId/exams", protect, getCourseExams);
module.exports = router;