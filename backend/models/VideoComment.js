const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    isTeacherReply: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const videoCommentSchema = new mongoose.Schema(
  {
    video: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    replies: { type: [replySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VideoComment", videoCommentSchema);