const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    durationMinutes: { type: Number, default: 20 },
    isCompetitive: { type: Boolean, default: false }, // يدخل في نظام المنافسة ولا لأ
    isFinal: { type: Boolean, default: false }, // امتحان نهائي - النجاح فيه يديله شهادة
    passingPercent: { type: Number, default: 50 }, // نسبة النجاح المطلوبة للشهادة
    availableFrom: { type: Date, default: null },   // من إمتى الامتحان يفتح - null يعني مفتوح من الأول
    availableUntil: { type: Date, default: null },  // لحد إمتى - بعدها محدش يقدر يبدأ الامتحان حتى لو أول مرة
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);