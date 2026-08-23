const express = require("express");
const {
  createExam, updateExam, deleteExam, addQuestion, updateQuestion, deleteQuestion,
  getExamForStudent, getExamForTeacher, startExam, submitExam, reportTabSwitch,
  getLeaderboard, getPendingGrading, gradeEssayAnswer, bulkAddQuestionsFromText,
  getMyMistakes,
} = require("../controllers/examController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, restrictTo("teacher", "admin"), createExam);
router.patch("/:examId", protect, restrictTo("teacher", "admin"), updateExam);
router.delete("/:examId", protect, restrictTo("teacher", "admin"), deleteExam);
router.get("/:examId/teacher-view", protect, restrictTo("teacher", "admin"), getExamForTeacher);

router.post("/:examId/questions", protect, restrictTo("teacher", "admin"), addQuestion);
router.post("/:examId/questions/bulk-text", protect, restrictTo("teacher", "admin"), bulkAddQuestionsFromText);
router.patch("/questions/:questionId", protect, restrictTo("teacher", "admin"), updateQuestion);
router.delete("/questions/:questionId", protect, restrictTo("teacher", "admin"), deleteQuestion);

router.get("/:examId", protect, getExamForStudent);
router.post("/:examId/start", protect, restrictTo("student"), startExam);
router.post("/:examId/tab-switch", protect, restrictTo("student"), reportTabSwitch);
router.post("/:examId/submit", protect, restrictTo("student"), submitExam);
router.get("/leaderboard/top", protect, getLeaderboard);

router.get("/:examId/pending-grading", protect, restrictTo("teacher", "admin"), getPendingGrading);
router.patch("/submissions/:submissionId/grade", protect, restrictTo("teacher", "admin"), gradeEssayAnswer);

// أسئلة الطالب الغلط - عبر كل الامتحانات وكل الكورسات
router.get("/mistakes/mine", protect, restrictTo("student"), getMyMistakes);

module.exports = router;