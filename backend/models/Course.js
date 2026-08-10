const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    price: { type: Number, default: 0 }, // بالجنيه المصري
    isFree: { type: Boolean, default: false },
    coverImageFilename: String, // اسم ملف صورة الغلاف المرفوعة
    category: {
      type: String,
      enum: ["رياضيات", "علوم", "لغات", "حاسب آلي", "تاريخ وجغرافيا", "أخرى"],
      default: "أخرى",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
