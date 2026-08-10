const Submission = require("../models/Submission");
const Payment = require("../models/Payment");
const User = require("../models/User");

// كل بيانات بروفايل الطالب في مكان واحد
exports.getMyProfile = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id, status: "submitted" })
      .populate({ path: "exam", populate: { path: "course", select: "title" } })
      .sort("-submittedAt");

    const payments = await Payment.find({ user: req.user._id }).populate("course", "title price");

    const user = await User.findById(req.user._id).populate("certificates", "title");

    res.json({
user: { name: user.name, email: user.email, points: user.points, role: user.role },
      submissions,
      payments,
      certificates: user.certificates,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
