const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const Video = require("../models/Video");
const Course = require("../models/Course");
const Payment = require("../models/Payment");

// السر بتاع توكن الفيديو - منفصل عن توكن تسجيل الدخول العادي
const VIDEO_SECRET = process.env.JWT_SECRET + "_video";

// الخطوة 1: الطالب بيطلب "إذن مشاهدة" للفيديو - بنتأكد إنه دافع الأول
exports.getVideoToken = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ message: "الفيديو مش موجود" });

    const course = await Course.findById(video.course);
    if (!course.isFree && req.user.role === "student") {
      const paid = await Payment.findOne({ user: req.user._id, course: course._id, status: "paid" });
      if (!paid) return res.status(403).json({ message: "لازم تدفع تمن الكورس الأول" });
    }

    // لو الفيديو مش رفوعه محلي (يعني رابط خارجي من Cloudinary مثلاً) نرجعه زي ما هو
    if (!video.localFilename) {
      return res.json({ streamUrl: video.videoUrl, protected: false });
    }

    // تكون صالح لساعتين ومربوط بالفيديو والطالب ده تحديدًا
    const token = jwt.sign(
      { videoId: video._id.toString(), userId: req.user._id.toString() },
      VIDEO_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ streamUrl: `/api/videos/stream/${video._id}?token=${token}`, protected: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// الخطوة 2: بث الفيديو نفسه - بيتأكد من التوكن مش من تسجيل الدخول العادي
// (عشان تاج <video> في المتصفح مايقدرش يبعت Authorization header)
exports.streamVideo = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(401).json({ message: "مفيش صلاحية مشاهدة" });

    let payload;
    try {
      payload = jwt.verify(token, VIDEO_SECRET);
    } catch {
      return res.status(401).json({ message: "رابط المشاهدة منتهي، اطلب واحد جديد" });
    }

    if (payload.videoId !== req.params.videoId) {
      return res.status(403).json({ message: "توكن غير مطابق" });
    }

    const video = await Video.findById(req.params.videoId);
    if (!video || !video.localFilename) return res.status(404).json({ message: "الفيديو مش موجود" });

    const filePath = path.join(__dirname, "../uploads/videos", video.localFilename);

    // فيديوهات قديمة لسه متخزنة فعليًا على الديسك المحلي - بث مباشر زي ما كان
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const range = req.headers.range;

      if (!range) {
        res.writeHead(200, { "Content-Length": stat.size, "Content-Type": "video/mp4" });
        return fs.createReadStream(filePath).pipe(res);
      }

      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
        "Content-Disposition": "inline",
      });
      return fs.createReadStream(filePath, { start, end }).pipe(res);
    }

    // مش موجود على الديسك = الفيديو ده متخزن على Cloudinary
    // localFilename هنا فعليًا هو الـ public_id اللي رجع وقت الرفع
    const signedUrl = cloudinary.url(video.localFilename, {
      resource_type: "video",
      type: "authenticated",
      sign_url: true,
      secure: true,
    });

    return res.redirect(302, signedUrl);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// تسجيل الفيديو كـ "متابَع" من الطالب
exports.markVideoWatched = async (req, res) => {
  try {
    const User = require("../models/User");
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { watchedVideos: req.params.videoId } });
    res.json({ message: "تم تسجيل المشاهدة" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
