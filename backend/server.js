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

// ✅ CORS في الأول - قبل أي routes
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ معالجة OPTIONS requests

app.use(express.json());

// الاتصال بالداتابيز
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

// ✅ 404 handler مع CORS
app.use((req, res) => {
  res.status(404).json({ message: "المسار غير موجود" });
});

// ✅ معالجة الأخطاء - مع CORS headers
app.use((err, req, res, next) => {
  console.error("🔥 Global Error Handler:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "حصل خطأ داخلي في السيرفر",
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