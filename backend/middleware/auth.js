const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "غير مصرح - لازم تسجل دخول" });
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "المستخدم غير موجود" });
    // نتأكد إن الحساب لسه شغال حتى لو التوكن نفسه لسه صالح - يمنع مستخدم متعطل
    // من الاستمرار في استخدام الموقع لحد ما التوكن ينتهي بعد 7 أيام
    if (!req.user.isActive) {
      return res.status(403).json({ message: "حسابك متعطل، تواصل مع الإدارة" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: "توكن غير صالح" });
  }
};

const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "مش معاك صلاحية لده" });
  }
  next();
};

module.exports = { protect, restrictTo };