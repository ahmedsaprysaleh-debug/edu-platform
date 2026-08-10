const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher", "admin"], default: "student" },
    points: { type: Number, default: 0 }, // نقاط المنافسة
enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
watchedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    certificates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }], // كورسات خلصها بنجاح
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isActive: { type: Boolean, default: true }, // للأدمن: تعطيل حساب
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
