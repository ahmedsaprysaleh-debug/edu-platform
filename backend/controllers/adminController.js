const User = require("../models/User");
const Course = require("../models/Course");
const Payment = require("../models/Payment");

const VALID_ROLES = ["student", "teacher", "admin"];

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort("-createdAt");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: "الدور المطلوب غير صحيح" });
    }

    // نمنع الأدمن من تغيير الدور بتاعه هو نفسه (تفاديًا لموقف يفقد فيه صلاحيته بالغلط)
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "متقدرش تغيّر الدور بتاعك انت نفسك" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: "المستخدم مش موجود" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleUserActive = async (req, res) => {
  try {
    // نمنع الأدمن من تعطيل حسابه هو نفسه ويقفل بره النظام بالغلط
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "متقدرش تعطّل حسابك انت نفسك" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "المستخدم مش موجود" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ id: user._id, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // نمنع الأدمن من حذف حسابه هو نفسه
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "متقدرش تحذف حسابك انت نفسك" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "المستخدم مش موجود" });
    res.json({ message: "تم حذف المستخدم" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [studentsCount, teachersCount, coursesCount, revenueResult] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      Course.countDocuments(),
      // نخلي MongoDB نفسه يجمع المبالغ بدل ما نجيب كل السجلات ونجمعها في الكود
      Payment.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    res.json({ studentsCount, teachersCount, coursesCount, totalRevenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};