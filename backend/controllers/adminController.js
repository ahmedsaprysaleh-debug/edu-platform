const User = require("../models/User");
const Course = require("../models/Course");
const Payment = require("../models/Payment");

exports.getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").sort("-createdAt");
  res.json(users);
};

exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
  if (!user) return res.status(404).json({ message: "المستخدم مش موجود" });
  res.json(user);
};

exports.toggleUserActive = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "المستخدم مش موجود" });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ id: user._id, isActive: user.isActive });
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "تم حذف المستخدم" });
};

exports.getStats = async (req, res) => {
  const [studentsCount, teachersCount, coursesCount, paidPayments] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "teacher" }),
    Course.countDocuments(),
    Payment.find({ status: "paid" }),
  ]);
  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  res.json({ studentsCount, teachersCount, coursesCount, totalRevenue });
};
