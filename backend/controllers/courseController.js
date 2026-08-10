const Course = require("../models/Course");
const Video = require("../models/Video");
const Payment = require("../models/Payment");
const Exam = require("../models/Exam");
const Question = require("../models/Question");
const fs = require("fs");
const path = require("path");

exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create({ ...req.body, teacher: req.user._id });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// عرض الكورسات - بيدعم بحث بالاسم وفلترة بالتصنيف والمجانية
exports.getCourses = async (req, res) => {
  const { search, category, isFree } = req.query;
  const filter = {};
  if (search) filter.title = { $regex: search, $options: "i" };
  if (category) filter.category = category;
  if (isFree === "true") filter.isFree = true;

  const courses = await Course.find(filter).populate("teacher", "name").sort("-createdAt");
  res.json(courses);
};

exports.getCourseById = async (req, res) => {
  const course = await Course.findById(req.params.id).populate("teacher", "name");
  if (!course) return res.status(404).json({ message: "الكورس مش موجود" });
  res.json(course);
};

// تعديل كورس - المدرّس بتاعه بس أو الأدمن
exports.updateCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "الكورس مش موجود" });
  if (req.user.role !== "admin" && course.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "مش معاك صلاحية تعدّل الكورس ده" });
  }
  Object.assign(course, req.body);
  await course.save();
  res.json(course);
};

// حذف كورس - وكل الفيديوهات والامتحانات والأسئلة التابعة له
exports.deleteCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "الكورس مش موجود" });
  if (req.user.role !== "admin" && course.teacher.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "مش معاك صلاحية تحذف الكورس ده" });
  }

  const videos = await Video.find({ course: course._id });
  videos.forEach((v) => {
    if (v.localFilename) {
      const p = path.join(__dirname, "../uploads/videos", v.localFilename);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  });
  await Video.deleteMany({ course: course._id });

  const exams = await Exam.find({ course: course._id });
  await Question.deleteMany({ exam: { $in: exams.map((e) => e._id) } });
  await Exam.deleteMany({ course: course._id });

  if (course.coverImageFilename) {
    const p = path.join(__dirname, "../uploads/images", course.coverImageFilename);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  await course.deleteOne();
  res.json({ message: "تم حذف الكورس وكل محتواه" });
};

// إضافة فيديو لكورس (المدرّس بس)
exports.addVideo = async (req, res) => {
  try {
    const { title, description, localFilename, videoUrl, order } = req.body;

    if (!videoUrl && !localFilename) {
      return res.status(400).json({ message: "لازم تحط رابط الفيديو" });
    }

    const video = await Video.create({
      title, description, order,
      course: req.params.courseId,
      videoUrl: videoUrl || `local:${localFilename}`,
      localFilename: localFilename || undefined,
    });
    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateVideo = async (req, res) => {
  const { title, description, order, videoUrl } = req.body;
  const update = { title, description, order };
  if (videoUrl) update.videoUrl = videoUrl;
  const video = await Video.findByIdAndUpdate(
    req.params.videoId, update, { new: true }
  );
  if (!video) return res.status(404).json({ message: "الفيديو مش موجود" });
}

exports.deleteVideo = async (req, res) => {
  const video = await Video.findById(req.params.videoId);
  if (!video) return res.status(404).json({ message: "الفيديو مش موجود" });
  if (video.localFilename) {
    const p = path.join(__dirname, "../uploads/videos", video.localFilename);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  await video.deleteOne();
  res.json({ message: "تم حذف الفيديو" });
};

// عرض فيديوهات الكورس - بيتشيك إن الطالب دافع لو الكورس مدفوع
exports.getCourseVideos = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "الكورس مش موجود" });

    if (!course.isFree && req.user.role === "student") {
      const paid = await Payment.findOne({
        user: req.user._id,
        course: course._id,
        status: "paid",
      });
      if (!paid) {
        return res.status(403).json({ message: "لازم تدفع تمن الكورس الأول عشان تشوف الفيديوهات" });
      }
    }

    const videos = await Video.find({ course: req.params.courseId }).sort("order");
    const User = require("../models/User");
    const user = await User.findById(req.user._id).select("watchedVideos");
    const watchedIds = (user?.watchedVideos || []).map((id) => id.toString());

    const videosWithProgress = videos.map((v) => ({
      ...v.toObject(),
      watched: watchedIds.includes(v._id.toString()),
    }));

    res.json(videosWithProgress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.enrollFreeCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: "الكورس مش موجود" });
  if (!course.isFree) return res.status(403).json({ message: "الكورس ده مش مجاني" });

  const User = require("../models/User");
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { enrolledCourses: course._id } });
  res.json({ message: "تم الاشتراك في الكورس ✅" });
};

exports.getMyCourses = async (req, res) => {
  const User = require("../models/User");
  const user = await User.findById(req.user._id).populate({
    path: "enrolledCourses",
    populate: { path: "teacher", select: "name" },
  });
  res.json(user.enrolledCourses);
};