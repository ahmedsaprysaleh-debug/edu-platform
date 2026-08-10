const { body, validationResult } = require("express-validator");

// بيتشيك لو فيه أخطاء بعد قواعد الـ validation وبيرجعها بشكل موحد
exports.checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

exports.registerRules = [
  body("name").trim().isLength({ min: 2 }).withMessage("الاسم لازم يكون حرفين على الأقل"),
  body("email").isEmail().withMessage("الإيميل غير صحيح").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("الباسورد لازم يكون 6 حروف/أرقام على الأقل"),
];

exports.loginRules = [
  body("email").isEmail().withMessage("الإيميل غير صحيح").normalizeEmail(),
  body("password").notEmpty().withMessage("اكتب الباسورد"),
];

exports.courseRules = [
  body("title").trim().isLength({ min: 3 }).withMessage("عنوان الكورس قصير أوي"),
  body("price").optional().isFloat({ min: 0 }).withMessage("السعر لازم يكون رقم صحيح"),
];

exports.questionRules = [
  body("text").trim().isLength({ min: 3 }).withMessage("نص السؤال قصير أوي"),
  body("options").isArray({ min: 2 }).withMessage("لازم على الأقل اختيارين"),
  body("correctOptionIndex").isInt({ min: 0 }).withMessage("لازم تحدد الإجابة الصحيحة"),
];
