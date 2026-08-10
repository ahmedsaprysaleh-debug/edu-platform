const nodemailer = require("nodemailer");

// محتاج تحط بيانات إيميل حقيقي في .env (Gmail App Password مثلاً أو خدمة زي SendGrid)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendResetEmail = async (to, resetUrl) => {
  await transporter.sendMail({
    from: `"منصتي التعليمية" <${process.env.SMTP_USER}>`,
    to,
    subject: "إعادة تعيين كلمة المرور",
    html: `
      <div dir="rtl" style="font-family:sans-serif">
        <h2>إعادة تعيين كلمة المرور</h2>
        <p>اضغط على الرابط ده عشان تغيّر كلمة المرور بتاعتك (صالح لمدة 30 دقيقة):</p>
        <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px;">إعادة تعيين الباسورد</a>
        <p>لو مطلبتش ده، تجاهل الإيميل ده.</p>
      </div>
    `,
  });
};

exports.sendVerificationEmail = async (to, verifyUrl) => {
  await transporter.sendMail({
    from: `"منصتي التعليمية" <${process.env.SMTP_USER}>`,
    to,
    subject: "فعّل حسابك",
    html: `
      <div dir="rtl" style="font-family:sans-serif">
        <h2>أهلًا بيك 👋</h2>
        <p>اضغط على الرابط ده عشان تفعّل حسابك:</p>
        <a href="${verifyUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px;">تفعيل الحساب</a>
      </div>
    `,
  });
};
