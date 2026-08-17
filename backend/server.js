require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { generalLimiter, authLimiter, examLimiter } = require("./middleware/rateLimiter");

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const examRoutes = require("./routes/examRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");
const videoRoutes = require("./routes/videoRoutes");
const certificateRoutes = require("./routes/certificateRoutes");

const app = express();

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(generalLimiter);

// ملحوظة: ملفات /uploads متاحة كـ static قبل كده - اتشالت عشان محدش يلف على الفيديو
// مباشرة من غير توكن. البث بقى بيعدي حصريًا من خلال /api/videos/stream/:id?token=...
// الصور (أغلفة الكورسات) مش حساسة بنفس القدر فسايبينها static تحت مسار منفصل
app.use("/uploads/images", express.static(path.join(__dirname, "uploads/images")));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/exams/:examId/submit", examLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/certificates", certificateRoutes);

app.use((req, res) => res.status(404).json({ message: "المسار غير موجود" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "حصل خطأ في السيرفر" });
});

const PORT = process.env.PORT || 5000;

// شغّل app.listen بس لما تكون شغال محليًا (مش على Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// Vercel محتاج الـ app نفسه يتصدّر كـ module بدل ما يفضل شغال دايمًا
module.exports = app;
