require("dotenv").config();
const express = require("express");
const app = express();

app.set('trust proxy', 1);

const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const { generalLimiter, authLimiter, examLimiter } = require("./middleware/rateLimiter");

// ✅ أضيف هنا — جميع الـ routes
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const examRoutes = require("./routes/examRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");
const videoRoutes = require("./routes/videoRoutes");
const certificateRoutes = require("./routes/certificateRoutes");

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(generalLimiter);

// ... باقي الملف كما هو ...
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
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
