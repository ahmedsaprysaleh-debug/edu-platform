const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    description: String,
    // بيتخزن على خدمة خارجية (Cloudinary / Firebase Storage / Bunny.net) مش على السيرفر
    // أو محلي - في الحالة دي localFilename بيتحط عشان نقدر نبثه بأمان عن طريق توكن
    videoUrl: { type: String, required: true },
    localFilename: String,
    duration: Number, // بالثواني
    order: { type: Number, default: 0 },
    // ملف شرح مرفق (اختياري) - رابط خارجي زي Google Drive، بيظهر كزرار تحميل تحت الفيديو
    attachmentUrl: String,
    attachmentTitle: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema);