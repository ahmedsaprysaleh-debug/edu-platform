const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  type: {
    type: String,
    enum: ["multiple_choice", "true_false", "essay"],
    default: "multiple_choice",
  },
  text: { type: String, required: true },
  // اختيارات - لازمة فقط لـ multiple_choice و true_false
  options: [{ type: String }],
  correctOptionIndex: { type: Number }, // مش مطلوب في الأسئلة المقالية
  points: { type: Number, default: 1 },
});

module.exports = mongoose.model("Question", questionSchema);
