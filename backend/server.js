require("dotenv").config();

const express = require("express");
const app = express();
app.set("trust proxy", 1);
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { generalLimiter, authLimiter, examLimiter } = require("./middleware/rateLimiter");
const notificationRoutes = require("./routes/notificationRoutes");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const examRoutes = require("./routes/examRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");
const videoRoutes = require("./routes/videoRoutes");
const certificateRoutes = require("./routes/certificateRoutes");

// ✅ حل مشكلة الـ CORS نهائيًا بجعل الاستجابة مرنة ومتوافقة مع أخطاء الـ 500 على Vercel
app.use(
  cors({
    origin: true, // يوافق تلقائيًا على الـ Origins المرسلة ويمنع قفل المتصفح عند حدوث خطأ داخلي
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// الاتصال بالداتابيز مع معالجة أفضل للأخطاء لمنع تعليق الـ Serverless Function
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ Database Connection Error:", err);
    res.status(503).json({ message: "الخدمة غير متاحة، فشل الاتصال بقاعدة البيانات" });
  }
});

// المسارات والـ Limiters
app.use("/api", generalLimiter);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/exams", examLimiter, examRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

app.use((req, res) => res.status(404).json({ message: "المسار غير موجود" }));

// ✅ دالة معالجة الأخطاء لضمان إرجاع استجابة JSON واضحة ومقروءة للمتصفح حتى عند الانهيار
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler:", err);
  res.status(err.status || 500).json({ 
    success: false,
    message: err.message || "حصل خطأ داخلي في السيرفر" 
  });
});

// محلي فقط
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(() => {
      console.error("❌ فشل تشغيل السيرفر محليًا بسبب مشكلة اتصال بالداتابيز");
      process.exit(1);
    });
}

module.exports = app;
