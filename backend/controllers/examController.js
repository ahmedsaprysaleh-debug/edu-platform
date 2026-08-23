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

    // التحقق من نافذة إتاحة الامتحان - لو محدد له تاريخ بداية/نهاية
    const now = new Date();
    if (exam.availableFrom && now < exam.availableFrom) {
      return res.status(403).json({ message: "الامتحان لسه مفتحش" });
    }
    if (exam.availableUntil && now > exam.availableUntil) {
      return res.status(403).json({ message: "انتهت فترة إتاحة الامتحان" });
    }

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

// المدرّس بيشوف كل تسليمات امتحان معيّن اللي فيها أسئلة مقالية - سواء لسه محتاجة
// تصحيح أو اتصححت خلاص، عشان يقدر يراجع أو يعدّل درجة سابقة لو غلط فيها
exports.getPendingGrading = async (req, res) => {
  const submissions = await Submission.find({
    exam: req.params.examId,
    status: "submitted",
  })
    .populate("student", "name")
    .populate("answers.question");
  res.json(submissions);
};

exports.gradeEssayAnswer = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { questionId, awardedPoints } = req.body;

    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "التسليم مش موجود" });

    const answer = submission.answers.find((a) => a.question.toString() === questionId);
    if (!answer) return res.status(404).json({ message: "الإجابة مش موجودة" });

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "السؤال مش موجود" });

    const points = Number(awardedPoints);
    if (Number.isNaN(points) || points < 0 || points > question.points) {
      return res.status(400).json({ message: `الدرجة لازم تكون رقم بين 0 و ${question.points}` });
    }

    // بنسجل حالة التسليم قبل التعديل عشان نفرّق بين "أول تصحيح كامل" و"تعديل درجة اتصححت خلاص"
    const wasPending = submission.needsManualGrading;
    const oldAwarded = answer.awardedPoints; // null لو ده أول تصحيح للسؤال ده

    answer.awardedPoints = points;
    submission.score = submission.answers.reduce((sum, a) => sum + (a.awardedPoints || 0), 0);

    const stillPending = submission.answers.some((a) => a.awardedPoints === null);
    submission.needsManualGrading = stillPending;
    await submission.save();

    if (wasPending && !stillPending) {
      // أول مرة التسليم يكتمل تصحيحه بالكامل - نديله نقاط المسابقة والشهادة ونبعتله إشعار
      const exam = await Exam.findById(submission.exam);
      if (exam.isCompetitive) {
        await User.findByIdAndUpdate(submission.student, { $inc: { points: submission.score } });
      }
      if (exam.isFinal && submission.totalPoints > 0 &&
          (submission.score / submission.totalPoints) * 100 >= exam.passingPercent) {
        await User.findByIdAndUpdate(submission.student, { $addToSet: { certificates: exam.course } });
      }

      const { createNotification } = require("./notificationController");
      await createNotification({
        user: submission.student,
        type: "result_ready",
        message: `نتيجتك في امتحان "${exam.title}" جاهزة (${submission.score}/${submission.totalPoints})`,
        link: `/exams/${exam._id}`,
      });
    } else if (!wasPending && !stillPending) {
      // التسليم كان متصحح خلاص والمدرّس بيعدّل درجة سؤال فيه - منديش النقاط كاملة تاني،
      // بس نضيف/نطرح الفرق بس، ونعيد فحص أهلية الشهادة لو دلوقتي بقى مؤهل
      const delta = points - (oldAwarded || 0);
      if (delta !== 0) {
        const exam = await Exam.findById(submission.exam);
        if (exam.isCompetitive) {
          await User.findByIdAndUpdate(submission.student, { $inc: { points: delta } });
        }

        const nowPasses = exam.isFinal && submission.totalPoints > 0 &&
          (submission.score / submission.totalPoints) * 100 >= exam.passingPercent;

        if (nowPasses) {
          await User.findByIdAndUpdate(submission.student, { $addToSet: { certificates: exam.course } });
        } else if (exam.isFinal) {
          // التعديل خلّى الطالب مش مستحق الشهادة - مش بنسحبها تلقائيًا لأنها قرار
          // حساس بيمس الطالب مباشرة، بنسجل تحذير عشان المدرّس ياخد القرار بنفسه
          const student = await User.findById(submission.student).select("name certificates");
          if (student?.certificates?.some((c) => c.toString() === exam.course?.toString())) {
            console.warn(
              `[grading] تعديل درجة خلّى الطالب ${student.name} (${submission.student}) ` +
              `مش مستحق شهادة الكورس ${exam.course} بعد ما كانت اتدّتله - محتاجة مراجعة يدوية، مش هتتسحب تلقائيًا.`
            );
          }
        }

        const { createNotification } = require("./notificationController");
        await createNotification({
          user: submission.student,
          type: "result_ready",
          message: `درجتك في امتحان "${exam.title}" اتعدّلت (${submission.score}/${submission.totalPoints})`,
          link: `/exams/${exam._id}`,
        });
      }
    }

    res.json({ message: "تم حفظ الدرجة", score: submission.score, needsManualGrading: stillPending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// لوحة الصدارة - أعلى الطلاب نقاطًا (للمسابقات)
exports.getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({ role: "student" })
      .sort({ points: -1 })
      .limit(10)
      .select("name points");
    res.json(topUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// دالة مساعدة - تحويل كتلة نص واحدة (سؤال واحد) لكائن سؤال جاهز للحفظ
// الصيغة المتوقعة:
// س: نص السؤال
// 1) اختيار
// 2) اختيار
// الإجابة: 1   <- رقم الاختيار الصح (1-indexed)
// الدرجة: 2    <- اختياري، افتراضي 1
function parseQuestionBlock(block, examId) {
  const lines = block.split("\n").map((l) => l.trim()).filter((l) => l !== "");
  if (lines.length === 0) return { error: "بلوك فاضي" };

  const textLine = lines.find((l) => l.startsWith("س:") || l.startsWith("س :"));
  if (!textLine) return { error: "مفيش سطر يبدأ بـ 'س:' يحتوي نص السؤال" };
  const text = textLine.replace(/^س\s*:/, "").trim();
  if (!text) return { error: "نص السؤال فاضي" };

  const optionLines = lines.filter((l) => /^\d+\)/.test(l));
  if (optionLines.length < 2) return { error: "لازم اختيارين على الأقل بالصيغة '1) ...'" };
  const options = optionLines.map((l) => l.replace(/^\d+\)\s*/, "").trim());

  const answerLine = lines.find((l) => l.startsWith("الإجابة:") || l.startsWith("الإجابة :"));
  if (!answerLine) return { error: "مفيش سطر 'الإجابة:'" };
  const answerNum = parseInt(answerLine.replace(/^الإجابة\s*:/, "").trim(), 10);
  if (!answerNum || answerNum < 1 || answerNum > options.length) {
    return { error: "رقم الإجابة غير صحيح أو مش موجود ضمن الاختيارات" };
  }
  const correctOptionIndex = answerNum - 1;

  const pointsLine = lines.find((l) => l.startsWith("الدرجة:") || l.startsWith("الدرجة :"));
  let points = 1;
  if (pointsLine) {
    const parsedPoints = parseInt(pointsLine.replace(/^الدرجة\s*:/, "").trim(), 10);
    if (parsedPoints > 0) points = parsedPoints;
  }

  // لو الاختيارات بالظبط "صح" و"خطأ" (بأي ترتيب) نعتبره صح/خطأ، غير كده اختيار من متعدد
  const isTrueFalse =
    options.length === 2 &&
    options.map((o) => o.trim()).sort().join("|") === ["صح", "خطأ"].sort().join("|");

  return {
    exam: examId,
    type: isTrueFalse ? "true_false" : "multiple_choice",
    text,
    options,
    correctOptionIndex,
    points,
  };
}

// إضافة أسئلة بالجملة من نص - كل سؤال بلوك منفصل بسطر فاضي بينه وبين اللي بعده
exports.bulkAddQuestionsFromText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "ابعت النص المطلوب تحويله لأسئلة" });
    }

    const examId = req.params.examId;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "الامتحان مش موجود" });

    // نقسّم النص لبلوكات - كل بلوك سؤال، متفصولين بسطر فاضي واحد أو أكتر
    const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter((b) => b !== "");
    if (blocks.length === 0) {
      return res.status(400).json({ message: "مفيش أسئلة اتلاقت في النص" });
    }

    const toCreate = [];
    const errors = [];

    blocks.forEach((block, idx) => {
      const parsed = parseQuestionBlock(block, examId);
      if (parsed.error) {
        errors.push({ index: idx + 1, message: parsed.error });
      } else {
        toCreate.push(parsed);
      }
    });

    let createdQuestions = [];
    if (toCreate.length > 0) {
      createdQuestions = await Question.insertMany(toCreate);
    }

    res.status(201).json({
      message: `تم إضافة ${createdQuestions.length} سؤال بنجاح${errors.length ? ` (وتخطي ${errors.length} بسبب أخطاء)` : ""}`,
      created: createdQuestions.length,
      errors,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// دالة مساعدة - بتجمّع كل الأسئلة اللي طالب معيّن غلط فيها في كل امتحاناته المُسلَّمة
// (الأسئلة المقالية مُستبعدة لأنها مش مصححة تلقائيًا، فمفيش "صح/غلط" واضح ليها)
//
// ملحوظة مهمة: submission.answers.selectedOptionIndex بيكون بترتيب العرض المخلوط
// اللي الطالب شافه وقت الامتحان، مش الترتيب الأصلي في question.options. لازم نستخدم
// submission.optionOrders عشان نرجّعه للـ index الأصلي ونجيب نص الإجابة الصح.
async function buildStudentMistakes(studentId) {
  const submissions = await Submission.find({ student: studentId, status: "submitted" })
    .populate({
      path: "exam",
      populate: { path: "course", select: "title" },
    })
    .populate("answers.question");

  const mistakes = [];

  for (const submission of submissions) {
    if (!submission.exam) continue;

    const optionOrderMap = Object.fromEntries(
      (submission.optionOrders || []).map((o) => [o.question.toString(), o.order])
    );

    for (const answer of submission.answers) {
      const question = answer.question;
      if (!question || question.type === "essay") continue;
      if (answer.awardedPoints > 0) continue; // جاوب صح - مش غلطة

      const order = optionOrderMap[question._id.toString()] || [];
      const displayedIndex = answer.selectedOptionIndex;
      const originalIndex = displayedIndex != null ? order[displayedIndex] : null;

      mistakes.push({
        examId: submission.exam._id,
        examTitle: submission.exam.title,
        courseTitle: submission.exam.course?.title || null,
        questionId: question._id,
        questionText: question.text,
        studentAnswer: originalIndex != null ? question.options[originalIndex] : null,
        correctAnswer: question.options[question.correctOptionIndex],
        points: question.points,
        submittedAt: submission.submittedAt,
      });
    }
  }

  return mistakes;
}

// الطالب بيشوف كل الأسئلة اللي غلط فيها بنفسه، في كل الامتحانات، في كل الكورسات
exports.getMyMistakes = async (req, res) => {
  try {
    const mistakes = await buildStudentMistakes(req.user._id);
    res.json({ total: mistakes.length, mistakes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};