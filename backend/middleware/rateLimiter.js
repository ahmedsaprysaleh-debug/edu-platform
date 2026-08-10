const rateLimit = require("express-rate-limit");

// عام - كل الـ API
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 300,
  message: { message: "طلبات كتير أوي، حاول تاني بعد شوية" },
});

// تسجيل الدخول - حماية من محاولات تخمين الباسورد
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "محاولات تسجيل دخول كتير، حاول تاني بعد 15 دقيقة" },
});

// تسليم الامتحانات - يمنع البوتات من قصف السيرفر بإجابات
exports.examLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: "بطّئ شوية 🙂" },
});
