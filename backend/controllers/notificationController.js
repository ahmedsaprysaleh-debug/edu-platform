const Notification = require("../models/Notification");

// دالة مساعدة داخلية - بتستخدم من كنترولرز تانية (videoController, examController)
// عشان تسجّل إشعار جديد لمستخدم معين
exports.createNotification = async ({ user, type, message, link }) => {
  try {
    await Notification.create({ user, type, message, link });
  } catch (err) {
    // منسيبش فشل الإشعار يوقف العملية الأساسية (زي إضافة سؤال أو تصحيح درجة)
    console.error("فشل إنشاء إشعار:", err.message);
  }
};

// عرض إشعارات المستخدم الحالي - الأحدث أولًا
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort("-createdAt")
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// تحديد إشعار معين كمقروء
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "الإشعار مش موجود" });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// تحديد كل الإشعارات كمقروءة دفعة واحدة
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: "تم تحديد كل الإشعارات كمقروءة" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
