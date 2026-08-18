const rateLimit = require("express-rate-limit");

exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  trustProxy: 1,  // ✅ أضيف هنا
  message: { message: "محاولات كثيرة جداً، حاول مرة أخرى لاحقاً" },
});

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  trustProxy: 1,  // ✅ أضيف هنا
  message: { message: "محاولات دخول كثيرة، حاول بعد 15 دقيقة" },
});

exports.examLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  trustProxy: 1,  // ✅ أضيف هنا
  message: { message: "محاولات كثيرة جداً" },
});