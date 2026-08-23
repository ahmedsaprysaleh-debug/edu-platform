const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true }, // زي: "new_question", "new_comment_reply", "result_ready"
    message: { type: String, required: true },
    link: { type: String }, // رابط داخل الموقع يوديه لمكان الإشعار (اختياري)
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
