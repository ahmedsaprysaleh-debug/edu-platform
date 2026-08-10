const Exam = require("../models/Exam");
const Question = require("../models/Question");
const Submission = require("../models/Submission");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.createExam = async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addQuestion = async (req, res) => {
  try {
    const { type } = req.body;
    let payload = { ...req.body, exam: req.params.examId };

    if (type === "true_false") payload.options = ["صح", "خطأ"];
    if (type === "essay") { payload.options = []; payload.correctOptionIndex = undefined; }

    const question = await Question.create(payload);
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { type } = req.body;
    let payload = { ...req.body };
    if (type === "true_false") payload.options = ["صح", "خطأ"];
    if (type === "essay") { payload.options = []; payload.correctOptionIndex = undefined; }

    const question = await Question.findByIdAndUpdate(req.params.questionId, payload, { new: true });
    if (!question) return res.status(404).json({ message: "السؤال مش موجود" });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  const question = await Question.findByIdAndDelete(req.params.questionId);
  if (!question) return res.status(404).json({ message: "السؤال مش موجود" });
  res.json({ message: "تم حذف السؤال" });
};

// عرض أسئلة الامتحان للمدرّس (بالإجابة الصح) عشان يعدّل عليها
exports.getExamForTeacher = async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  const questions = await Question.find({ exam: req.params.examId });
  res.json({ exam, questions });
};

exports.updateExam = async (req, res) => {
  const exam = await Exam.findByIdAndUpdate(req.params.examId, req.body, { new: true });
  if (!exam) return res.status(404).json({ message: "الامتحان مش موجود" });
  res.json(exam);
};

exports.deleteExam = async (req, res) => {
  const exam = await Exam.findByIdAndDelete(req.params.examId);
  if (!exam) return res.status(404).json({ message: "الامتحان مش موجود" });
  await Question.deleteMany({ exam: exam._id });
  res.json({ message: "تم حذف الامتحان وكل أسئلته" });
};

// عرض الامتحان للطالب - من غير إظهار الإجابة الصح
exports.getExamForStudent = async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  const questions = await Question.find({ exam: req.params.examId }).select("-correctOptionIndex");
  res.json({ exam, questions });
};

// دالة مساعدة - خلط عناصر مصفوفة عشوائيًا (Fisher-Yates)
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// بدء الامتحان - بيسجل وقت البداية في السيرفر (مش في المتصفح) عشان مايتغشش
// وبيخلط ترتيب الأسئلة والاختيارات لكل طالب لوحده (منع الغش بالنقل من زميل)
exports.startExam = async (req, res) => {
  try {
    const examId = req.params.examId;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "الامتحان مش موجود" });

    let submission = await Submission.findOne({ exam: examId, student: req.user._id });
    if (submission && submission.status === "submitted") {
      return res.status(400).json({ message: "أنت سلّمت الامتحان ده قبل كده" });
    }

    const questions = await Question.find({ exam: examId });

    if (!submission) {
      // نولّد ترتيب عشوائي جديد للأسئلة، وترتيب عشوائي للاختيارات في كل سؤال اختياري
      const questionOrder = shuffleArray(questions.map((q) => q._id));
      const optionOrders = questions
        .filter((q) => q.type !== "essay")
        .map((q) => ({
          question: q._id,
          order: shuffleArray(q.options.map((_, idx) => idx)), // مصفوفة بالـ index الأصلي بعد الخلط
        }));

      submission = await Submission.create({
        exam: examId,
        student: req.user._id,
        startedAt: new Date(),
        status: "in_progress",
        questionOrder,
        optionOrders,
      });
    }

    // نبني نسخة الأسئلة اللي هتتعرض للطالب بالترتيب المخلوط بتاعه، من غير الإجابة الصح
    const qMap = Object.fromEntries(questions.map((q) => [q._id.toString(), q]));
    const optionOrderMap = Object.fromEntries(
      submission.optionOrders.map((o) => [o.question.toString(), o.order])
    );

    const shuffledQuestions = submission.questionOrder.map((qid) => {
      const q = qMap[qid.toString()];
      if (!q) return null;
      const order = optionOrderMap[qid.toString()];
      const options = order ? order.map((origIdx) => q.options[origIdx]) : q.options;
      return { _id: q._id, type: q.type, text: q.text, options, points: q.points };
    }).filter(Boolean);

    res.json({
      submissionId: submission._id,
      startedAt: submission.startedAt,
      durationMinutes: exam.durationMinutes,
      examTitle: exam.title,
      questions: shuffledQuestions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// الطالب بيبلّغ إنه سرّح من التاب وقت الامتحان - بنسجلها للمدرّس يشوفها بعدين
exports.reportTabSwitch = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      exam: req.params.examId, student: req.user._id, status: "in_progress",
    });
    if (!submission) return res.status(404).json({ message: "مفيش امتحان شغال" });
    submission.tabSwitchCount += 1;
    await submission.save();
    res.json({ tabSwitchCount: submission.tabSwitchCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// تسليم الامتحان - تصحيح تلقائي للاختيار من متعدد وصح/خطأ، والمقالي بيستنى تصحيح المدرّس
exports.submitExam = async (req, res) => {
  try {
    const { answers } = req.body; // [{questionId, selectedOptionIndex?, essayAnswer?}] - selectedOptionIndex بترتيب العرض المخلوط
    const examId = req.params.examId;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "الامتحان مش موجود" });

    const submission = await Submission.findOne({ exam: examId, student: req.user._id });
    if (!submission) return res.status(400).json({ message: "لازم تبدأ الامتحان الأول" });
    if (submission.status === "submitted") {
      return res.status(400).json({ message: "أنت سلّمت الامتحان ده قبل كده" });
    }

    const allowedMs = (exam.durationMinutes * 60 + 60) * 1000;
    const elapsedMs = Date.now() - new Date(submission.startedAt).getTime();
    if (elapsedMs > allowedMs) {
      return res.status(400).json({ message: "انتهى وقت الامتحان، مقدرش أستقبل إجابات جديدة" });
    }

    const questions = await Question.find({ exam: examId });
    const optionOrderMap = Object.fromEntries(
      submission.optionOrders.map((o) => [o.question.toString(), o.order])
    );

    let score = 0;
    let totalPoints = 0;
    let needsManualGrading = false;

    const detailedAnswers = questions.map((q) => {
      totalPoints += q.points;
      const studentAnswer = answers.find((a) => a.questionId === q._id.toString()) || {};

      if (q.type === "essay") {
        needsManualGrading = true;
        return { question: q._id, essayAnswer: studentAnswer.essayAnswer || "", awardedPoints: null };
      }

      // selectedOptionIndex جاي بترتيب العرض المخلوط - لازم نرجعه للـ index الأصلي عشان نقارنه صح
      const displayedIndex = studentAnswer.selectedOptionIndex;
      const order = optionOrderMap[q._id.toString()] || [];
      const originalIndex = displayedIndex != null ? order[displayedIndex] : null;

      const awarded = originalIndex === q.correctOptionIndex ? q.points : 0;
      score += awarded;
      return { question: q._id, selectedOptionIndex: displayedIndex, awardedPoints: awarded };
    });

    submission.answers = detailedAnswers;
    submission.score = score;
    submission.totalPoints = totalPoints;
    submission.needsManualGrading = needsManualGrading;
    submission.submittedAt = new Date();
    submission.status = "submitted";
    await submission.save();

    let certificateEarned = false;
    if (!needsManualGrading) {
      if (exam.isCompetitive) {
        await User.findByIdAndUpdate(req.user._id, { $inc: { points: score } });
      }
      if (exam.isFinal && totalPoints > 0 && (score / totalPoints) * 100 >= exam.passingPercent) {
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { certificates: exam.course } });
        certificateEarned = true;
      }
    }

    res.status(201).json({
      studentName: req.user.name,
      score,
      totalPoints,
      examTitle: exam.title,
      certificateEarned,
      needsManualGrading,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// المدرّس بيشوف كل التسليمات اللي محتاجة تصحيح يدوي لامتحان معين
exports.getPendingGrading = async (req, res) => {
  const submissions = await Submission.find({
    exam: req.params.examId,
    needsManualGrading: true,
    status: "submitted",
  })
    .populate("student", "name")
    .populate("answers.question");
  res.json(submissions);
};

// المدرّس بيدّي درجة لسؤال مقالي معين جوه تسليم معين
exports.gradeEssayAnswer = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { questionId, awardedPoints } = req.body;

    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "التسليم مش موجود" });

    const answer = submission.answers.find((a) => a.question.toString() === questionId);
    if (!answer) return res.status(404).json({ message: "الإجابة مش موجودة" });

    answer.awardedPoints = awardedPoints;
    submission.score = submission.answers.reduce((sum, a) => sum + (a.awardedPoints || 0), 0);

    const stillPending = submission.answers.some((a) => a.awardedPoints === null);
    submission.needsManualGrading = stillPending;
    await submission.save();

    // لو خلص تصحيح كل الأسئلة، دلوقتي نحسب النقاط والشهادة
    if (!stillPending) {
      const exam = await Exam.findById(submission.exam);
      if (exam.isCompetitive) {
        await User.findByIdAndUpdate(submission.student, { $inc: { points: submission.score } });
      }
      if (exam.isFinal && submission.totalPoints > 0 &&
          (submission.score / submission.totalPoints) * 100 >= exam.passingPercent) {
        await User.findByIdAndUpdate(submission.student, { $addToSet: { certificates: exam.course } });
      }
    }

    res.json({ message: "تم حفظ الدرجة", score: submission.score, needsManualGrading: stillPending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// نظام المنافسة - الليدر بورد (عام أو لكورس معين)
exports.getLeaderboard = async (req, res) => {
  const { courseId } = req.query;

  if (!courseId) {
    // الليدر بورد العام - رصيد النقاط الكلي لكل طالب
    const topStudents = await User.find({ role: "student" })
      .sort({ points: -1 })
      .limit(50)
      .select("name points");
    return res.json(topStudents);
  }

  // ليدر بورد خاص بكورس معين - بنجمع درجات الطالب في الامتحانات التنافسية بتاعت الكورس ده بس
  const results = await Submission.aggregate([
    { $match: { status: "submitted" } },
    {
      $lookup: { from: "exams", localField: "exam", foreignField: "_id", as: "examData" },
    },
    { $unwind: "$examData" },
    {
      $match: {
        "examData.course": new mongoose.Types.ObjectId(courseId),
        "examData.isCompetitive": true,
      },
    },
    { $group: { _id: "$student", totalScore: { $sum: "$score" } } },
    { $sort: { totalScore: -1 } },
    { $limit: 50 },
    {
      $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "studentData" },
    },
    { $unwind: "$studentData" },
    { $project: { name: "$studentData.name", points: "$totalScore" } },
  ]);

  res.json(results);
};
// إضافة كذا سؤال دفعة واحدة من نص واحد
// الصيغة المتوقعة لكل سؤال:
// س: نص السؤال
// 1) اختيار أول
// 2) اختيار تاني
// الإجابة: رقم الاختيار الصح (1-based)
// الدرجة: رقم
// وكل سؤال متفصول عن اللي بعده بسطر فاضي
exports.bulkAddQuestionsFromText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "النص فاضي" });
    }

    // نقسّم النص لبلوكات، كل بلوك = سؤال واحد (متفصولين بسطر فاضي أو أكتر)
    const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

    const questionsToCreate = [];
    const errors = [];

    blocks.forEach((block, idx) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const questionLine = lines.find((l) => l.startsWith("س:") || l.startsWith("س :"));
      const answerLine = lines.find((l) => l.startsWith("الإجابة:") || l.startsWith("الإجابة :"));
      const pointsLine = lines.find((l) => l.startsWith("الدرجة:") || l.startsWith("الدرجة :"));
      const optionLines = lines.filter((l) => /^\d+\)/.test(l));

      if (!questionLine || !answerLine || optionLines.length < 2) {
        errors.push(`السؤال رقم ${idx + 1}: الصيغة غلط أو ناقصة`);
        return;
      }

      const text = questionLine.replace(/^س\s*:\s*/, "").trim();
      const options = optionLines.map((l) => l.replace(/^\d+\)\s*/, "").trim());
      const correctOptionIndex = parseInt(answerLine.replace(/^الإجابة\s*:\s*/, "").trim(), 10) - 1;
      const points = pointsLine ? parseInt(pointsLine.replace(/^الدرجة\s*:\s*/, "").trim(), 10) : 1;

      if (isNaN(correctOptionIndex) || correctOptionIndex < 0 || correctOptionIndex >= options.length) {
        errors.push(`السؤال رقم ${idx + 1}: رقم الإجابة غير صحيح`);
        return;
      }

      const type = options.length === 2 && options.includes("صح") && options.includes("خطأ")
        ? "true_false"
        : "multiple_choice";

      questionsToCreate.push({
        exam: req.params.examId,
        type,
        text,
        options,
        correctOptionIndex,
        points: isNaN(points) ? 1 : points,
      });
    });

    if (questionsToCreate.length === 0) {
      return res.status(400).json({ message: "مفيش أي سؤال اتفهم من النص", errors });
    }

    const created = await Question.insertMany(questionsToCreate);
    res.status(201).json({
      message: `تم إضافة ${created.length} سؤال بنجاح`,
      added: created.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};