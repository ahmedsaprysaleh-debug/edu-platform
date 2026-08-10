const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        selectedOptionIndex: Number, // للاختيار من متعدد وصح/خطأ
        essayAnswer: String, // للأسئلة المقالية
        awardedPoints: { type: Number, default: null }, // null = لسه محتاج تصحيح يدوي (للمقالي)
      },
    ],
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    needsManualGrading: { type: Boolean, default: false }, // فيه أسئلة مقالية لسه ماتصححتش
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    status: { type: String, enum: ["in_progress", "submitted"], default: "in_progress" },
    // منع الغش: ترتيب الأسئلة والاختيارات بيتحدد عشوائيًا لكل طالب وقت البداية ويتحفظ هنا
    questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    optionOrders: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        order: [Number], // مصفوفة بترتيب الـ index الأصلي لكل اختيار بعد الخلط
      },
    ],
    tabSwitchCount: { type: Number, default: 0 }, // كام مرة الطالب سرّح من الصفحة وقت الامتحان
  },
  { timestamps: true }
);

// يمنع الطالب من فتح نفس الامتحان أكتر من مرة في نفس الوقت
submissionSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);
