const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const videoFilter = (req, file, cb) => {
  const allowed = [".mp4", ".webm", ".mov"];
  const ext = "." + file.originalname.split(".").pop().toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("صيغة الفيديو غير مدعومة - استخدم mp4 أو webm أو mov"));
};

const imageFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = "." + file.originalname.split(".").pop().toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("صيغة الصورة غير مدعومة - استخدم jpg أو png أو webp"));
};

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "edu-platform/images",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "edu-platform/videos",
    resource_type: "video",
    type: "authenticated",
    allowed_formats: ["mp4", "webm", "mov"],
  },
});

exports.uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

exports.uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
});