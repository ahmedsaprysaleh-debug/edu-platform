const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ⚠️ ملحوظة مهمة: التخزين هنا محلي على السيرفر، وده كويس للتجربة بس.
// في الإنتاج الفعلي لازم تستخدم تخزين سحابي (Cloudinary / AWS S3 / Bunny.net)
// عشان الفيديوهات بتاخد مساحة كبيرة، وبعض خدمات الاستضافة (زي Render) بتمسح
// أي ملفات مرفوعة محليًا كل ما السيرفر يعيد تشغيل.

// إنشاء فولدرات uploads/images و uploads/videos تلقائيًا لو مش موجودة
["images", "videos"].forEach((sub) => {
  const dir = path.join(__dirname, `../uploads/${sub}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = (subfolder) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, `../uploads/${subfolder}`)),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const videoFilter = (req, file, cb) => {
  const allowed = [".mp4", ".webm", ".mov"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("صيغة الفيديو غير مدعومة - استخدم mp4 أو webm أو mov"));
};

const imageFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("صيغة الصورة غير مدعومة - استخدم jpg أو png أو webp"));
};

exports.uploadVideo = multer({
  storage: storage("videos"), fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 ميجا
});

exports.uploadImage = multer({
  storage: storage("images"), fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 ميجا
});
