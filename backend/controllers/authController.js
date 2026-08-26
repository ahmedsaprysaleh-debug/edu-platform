const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendResetEmail, sendVerificationEmail } = require("../config/email");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, teacherInviteCode } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "الإيميل ده مسجل قبل كده" });

    let finalRole = "student";
    if (role === "teacher") {
      if (!teacherInviteCode || teacherInviteCode !== process.env.TEACHER_INVITE_CODE) {
        return res.status(403).json({ message: "كود دعوة المدرّس غلط أو مش موجود" });
      }
      finalRole = "teacher";
    }

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      isVerified: true,
    });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: "رابط التفعيل غير صحيح أو تم استخدامه قبل كده" });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.json({ message: "تم تفعيل حسابك بنجاح ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const user = req.user;
    if (user.isVerified) return res.json({ message: "حسابك مفعّل بالفعل" });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    await sendVerificationEmail(user.email, verifyUrl);
    res.json({ message: "تم إرسال إيميل تفعيل جديد" });
  } catch (err) {
    res.status(500).json({ message: "فشل إرسال الإيميل - تأكد من إعدادات SMTP" });
  }
};

exports.resendVerificationByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.isVerified) {
      return res.json({ message: "لو الإيميل ده مسجل ومش مفعّل، هيوصلك إيميل تفعيل جديد" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    try {
      await sendVerificationEmail(user.email, verifyUrl);
    } catch (mailErr) {
      console.error("فشل إرسال إيميل التفعيل:", mailErr.message);
    }
    res.json({ message: "لو الإيميل ده مسجل ومش مفعّل، هيوصلك إيميل تفعيل جديد" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "الإيميل أو الباسورد غلط" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "حسابك متعطل، تواصل مع الإدارة" });
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "لو الإيميل ده مسجل، هيوصلك رابط إعادة التعيين" });

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    try {
      await sendResetEmail(user.email, resetUrl);
    } catch (mailErr) {
      console.error("فشل إرسال الإيميل:", mailErr.message);
    }
    res.json({ message: "لو الإيميل ده مسجل، هيوصلك رابط إعادة التعيين" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "الرابط غير صالح أو منتهي الصلاحية" });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "تم تغيير كلمة المرور بنجاح" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
