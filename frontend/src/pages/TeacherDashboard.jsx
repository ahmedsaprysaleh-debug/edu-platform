import { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../Toast";
import Spinner from "../components/Spinner";

const CATEGORIES = ["رياضيات", "علوم", "لغات", "حاسب آلي", "تاريخ وجغرافيا", "أخرى"];

// ==== إعدادات Cloudinary للرفع المباشر من الفرونت ====
const CLOUDINARY_CLOUD_NAME = "nulhcdks";
const CLOUDINARY_UPLOAD_PRESET = "course-videos";
const CHUNK_SIZE = 20 * 1024 * 1024; // 20 ميجا لكل جزء (الحد الموصى به من Cloudinary)

// رفع فيديو مباشرة على Cloudinary مع تقسيمه لأجزاء صغيرة
// ده ضروري للفيديوهات الكبيرة (فوق 100 ميجا خصوصًا) عشان طلب واحد كبير
// بيفشل أو بيعلّق على أي نت عادي، والتقسيم بيخلي كل جزء يترفع لوحده وبيقاوم انقطاع النت المؤقت
function uploadVideoToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    const uploadId = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let currentChunk = 0;

    function uploadChunk() {
      const start = currentChunk * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunk);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`
      );

      xhr.setRequestHeader("X-Unique-Upload-Id", uploadId);
      xhr.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${file.size}`);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          currentChunk++;
          const percent = Math.round((currentChunk / totalChunks) * 100);
          if (onProgress) onProgress(percent);

          if (currentChunk < totalChunks) {
            uploadChunk();
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data.secure_url);
            } catch (e) {
              reject(new Error("حصل خطأ في قراءة رد Cloudinary"));
            }
          }
        } else {
          let message = `فشل رفع الفيديو (كود ${xhr.status})`;
          try {
            const errData = JSON.parse(xhr.responseText);
            if (errData?.error?.message) message = `Cloudinary: ${errData.error.message}`;
          } catch (_) {}
          reject(new Error(message));
        }
      };

      xhr.ontimeout = () => reject(new Error("انتهت مهلة الاتصال بـ Cloudinary"));
      xhr.onerror = () => reject(new Error("حصل خطأ في الاتصال أثناء الرفع"));

      xhr.send(formData);
    }

    uploadChunk();
  });
}

export default function TeacherDashboard() {
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState(null);
  const [courseVideos, setCourseVideos] = useState([]);
  const [courseExams, setCourseExams] = useState([]);

  const [courseForm, setCourseForm] = useState({ title: "", description: "", price: 0, isFree: false, category: "أخرى" });
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [bulkText, setBulkText] = useState("");
const [bulkLoading, setBulkLoading] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);

const [videoForm, setVideoForm] = useState({ title: "", videoUrl: "", attachmentUrl: "", attachmentTitle: "" });
  const [uploading, setUploading] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState(null);

  const [videoMode, setVideoMode] = useState("link"); // "link" | "upload"
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [examForm, setExamForm] = useState({
    title: "",
    durationMinutes: 20,
    isCompetitive: false,
    isFinal: false,
    availableFrom: "",
    availableUntil: "",
  });
  const [activeExam, setActiveExam] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [qForm, setQForm] = useState({ type: "multiple_choice", text: "", options: ["", ""], correctOptionIndex: 0, points: 1 });
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  const imgBase = api.defaults.baseURL.replace("/api", "");

  const loadCourses = () => api.get("/courses").then((res) => setCourses(res.data)).finally(() => setLoading(false));
useEffect(() => { loadCourses(); }, []);

  const loadCourseDetails = (courseId) => {
    if (!courseId) { setCourseVideos([]); setCourseExams([]); return; }
    api.get(`/courses/${courseId}/videos`).then((res) => setCourseVideos(res.data)).catch(() => setCourseVideos([]));
    api.get(`/courses?search=`).then(() => {});
  };

  useEffect(() => { loadCourseDetails(activeCourse); setActiveExam(null); setQuestions([]); }, [activeCourse]);

  const resetCourseForm = () => {
    setCourseForm({ title: "", description: "", price: 0, isFree: false, category: "أخرى" });
    setEditingCourseId(null);
    setCoverFile(null);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      let coverImageFilename;
      if (coverFile) {
        setUploadingCover(true);
        const fd = new FormData();
        fd.append("image", coverFile);
        const { data } = await api.post("/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
        coverImageFilename = data.cloudinaryUrl;        setUploadingCover(false);
      }
      const payload = { ...courseForm, ...(coverImageFilename && { coverImageFilename }) };

      if (editingCourseId) {
        await api.patch(`/courses/${editingCourseId}`, payload);
        showToast("تم تعديل الكورس ✅");
      } else {
        await api.post("/courses", payload);
        showToast("تم إنشاء الكورس بنجاح ✅");
      }
      resetCourseForm();
      loadCourses();
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ", "error");
      setUploadingCover(false);
    }
  };

  const startEditCourse = (c) => {
    setEditingCourseId(c._id);
    setCourseForm({ title: c.title, description: c.description || "", price: c.price, isFree: c.isFree, category: c.category });
  };

  const deleteCourse = async (id) => {
    if (!confirm("متأكد؟ هيتحذف كل فيديوهات وامتحانات الكورس ده معاه.")) return;
    await api.delete(`/courses/${id}`);
    showToast("تم حذف الكورس");
    if (activeCourse === id) setActiveCourse(null);
    loadCourses();
  };

  const resetVideoForm = () => {
    setVideoForm({ title: "", videoUrl: "", attachmentUrl: "", attachmentTitle: "" });
    setVideoFile(null);
    setUploadProgress(0);
    setEditingVideoId(null);
  };
const handleUploadVideo = async (e) => {
    e.preventDefault();

    if (editingVideoId) {
      await api.patch(`/courses/${activeCourse}/videos/${editingVideoId}`, {
        title: videoForm.title,
        videoUrl: videoForm.videoUrl,
        attachmentUrl: videoForm.attachmentUrl,
        attachmentTitle: videoForm.attachmentTitle,
      });
      showToast("تم تعديل الفيديو ✅");
      resetVideoForm();
      loadCourseDetails(activeCourse);
      return;
    }

    if (videoMode === "upload") {
    if (!window.cloudinary) {
  showToast("جاري تحميل Cloudinary... حاول مرة تانية", "error");
  // جرب تحمّل الـ script يدويًا
  const script = document.createElement('script');
  script.src = 'https://upload-widget.cloudinary.com/latest/CloudinaryUploadWidget.js';
  script.onload = () => {
    console.log("Cloudinary loaded");
  };
  document.head.appendChild(script);
  return;
}

      window.cloudinary.openUploadWidget(
        {
          cloudName: "nulhcdks",
          uploadPreset: "course-videos",
          resourceType: "video",
          folder: "edu-platform/videos",
          maxFileSize: 500000000,
          multiple: false,
          sources: ["local"],
          showPoweredBy: false,
        },
        async (error, result) => {
          if (error) {
            showToast("فشل الرفع", "error");
            return;
          }

          if (result?.event === "success") {
            const videoUrl = result.info.secure_url;

            try {
              setUploading(true);
              await api.post(`/courses/${activeCourse}/videos`, {
                title: videoForm.title,
                videoUrl: videoUrl,
                attachmentUrl: videoForm.attachmentUrl,
                attachmentTitle: videoForm.attachmentTitle,
              });
              showToast("تم إضافة الفيديو للكورس ✅");
              resetVideoForm();
              loadCourseDetails(activeCourse);
            } catch (err) {
              showToast(err.response?.data?.message || "فشل إضافة الفيديو", "error");
            } finally {
              setUploading(false);
            }
          }
        }
      );
    } else if (videoMode === "link") {
      if (!videoForm.videoUrl) {
        showToast("حط رابط الفيديو الأول", "error");
        return;
      }

      try {
        setUploading(true);
        await api.post(`/courses/${activeCourse}/videos`, {
          title: videoForm.title,
          videoUrl: videoForm.videoUrl,
          attachmentUrl: videoForm.attachmentUrl,
          attachmentTitle: videoForm.attachmentTitle,
        });
        showToast("تم إضافة الفيديو للكورس ✅");
        resetVideoForm();
        loadCourseDetails(activeCourse);
      } catch (err) {
        showToast(err.response?.data?.message || "فشل إضافة الفيديو", "error");
      } finally {
        setUploading(false);
      }
    }
  };
const startEditVideo = (v) => {
  setEditingVideoId(v._id);
  setVideoMode("link");
  setVideoForm({
    title: v.title,
    videoUrl: v.videoUrl || "",
    attachmentUrl: v.attachmentUrl || "",
    attachmentTitle: v.attachmentTitle || "",
  });
};
const deleteVideo = async (videoId) => {
    if (!confirm("متأكد إنك عايز تحذف الفيديو ده؟")) return;
    await api.delete(`/courses/${activeCourse}/videos/${videoId}`);
    showToast("تم حذف الفيديو");
    loadCourseDetails(activeCourse);
  };

  const resetExamForm = () => {
    setExamForm({
      title: "",
      durationMinutes: 20,
      isCompetitive: false,
      isFinal: false,
      availableFrom: "",
      availableUntil: "",
    });
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...examForm,
        course: activeCourse,
        // datetime-local بيرجع string من غير timezone - لو فاضي نبعت null عشان الباك إند يفهمها "مفيش قيد"
        availableFrom: examForm.availableFrom ? new Date(examForm.availableFrom).toISOString() : null,
        availableUntil: examForm.availableUntil ? new Date(examForm.availableUntil).toISOString() : null,
      };
      const { data } = await api.post("/exams", payload);
      showToast("تم إنشاء الامتحان ✅");
      setActiveExam(data._id);
      setQuestions([]);
      resetExamForm();
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ", "error");
    }
  };

  const loadQuestions = (examId) => {
    if (!examId) return;
    api.get(`/exams/${examId}/teacher-view`).then((res) => setQuestions(res.data.questions));
  };
useEffect(() => { loadQuestions(activeExam); }, [activeExam]);

  const deleteExam = async (examId) => {
    if (!confirm("متأكد؟ هيتحذف كل أسئلة الامتحان ده معاه.")) return;
    await api.delete(`/exams/${examId}`);
    showToast("تم حذف الامتحان");
    if (activeExam === examId) { setActiveExam(null); setQuestions([]); }
  };

  const updateOption = (idx, value) => {
    const opts = [...qForm.options];
    opts[idx] = value;
    setQForm({ ...qForm, options: opts });
  };

  const resetQForm = () => {
    setQForm({ type: "multiple_choice", text: "", options: ["", ""], correctOptionIndex: 0, points: 1 });
    setEditingQuestionId(null);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      if (editingQuestionId) {
        await api.patch(`/exams/questions/${editingQuestionId}`, qForm);
        showToast("تم تعديل السؤال ✅");
      } else {
        await api.post(`/exams/${activeExam}/questions`, qForm);
        showToast("تم إضافة السؤال ✅");
      }
      resetQForm();
      loadQuestions(activeExam);
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ", "error");
    }
  };

  const startEditQuestion = (q) => {
    setEditingQuestionId(q._id);
    setQForm({
      type: q.type, text: q.text,
      options: q.type === "essay" ? ["", ""] : q.options,
      correctOptionIndex: q.correctOptionIndex ?? 0,
      points: q.points,
    });
  };

  const deleteQuestion = async (questionId) => {
    if (!confirm("متأكد إنك عايز تحذف السؤال ده؟")) return;
    await api.delete(`/exams/questions/${questionId}`);
    showToast("تم حذف السؤال");
    loadQuestions(activeExam);
  };
  const handleBulkAdd = async () => {
  if (!bulkText.trim()) return showToast("اكتب الأسئلة الأول", "error");
  setBulkLoading(true);
  try {
    const { data } = await api.post(`/exams/${activeExam}/questions/bulk-text`, { text: bulkText });
    showToast(data.message || "تم إضافة الأسئلة ✅");
    if (data.errors) showToast(`تحذير: ${data.errors.length} سؤال اتخطى بسبب صيغة غلط`, "error");
    setBulkText("");
    loadQuestions(activeExam);
  } catch (err) {
    showToast(err.response?.data?.message || "حصل خطأ", "error");
  } finally {
    setBulkLoading(false);
  }
};

  if (loading) return <div className="container"><Spinner /></div>;

  return (
    <div className="container">
      <h2>🧑‍🏫 لوحة تحكم المدرس</h2>

      <div className="card">
        <h3>{editingCourseId ? "تعديل الكورس" : "1) إنشاء كورس جديد"}</h3>
        <form onSubmit={handleSaveCourse}>
          <input placeholder="عنوان الكورس" required
            value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
          <textarea placeholder="وصف الكورس" rows={2}
            value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
          <select value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
            <input type="checkbox" style={{ width: "auto" }}
              checked={courseForm.isFree}
              onChange={(e) => setCourseForm({ ...courseForm, isFree: e.target.checked })} />
            كورس مجاني
          </label>
          {!courseForm.isFree && (
            <input type="number" placeholder="السعر بالجنيه" min={0}
              value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} />
          )}
          <label>صورة غلاف الكورس</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setCoverFile(e.target.files[0])} />

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn" type="submit" disabled={uploadingCover}>
              {uploadingCover ? "جاري رفع الصورة..." : editingCourseId ? "حفظ التعديلات" : "إنشاء الكورس"}
            </button>
            {editingCourseId && <button type="button" className="btn secondary" onClick={resetCourseForm}>إلغاء</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>كورساتي</h3>
        {courses.map((c) => (
          <div key={c._id} className="leaderboard-row" style={{ flexWrap: "wrap", gap: 8 }}>
            <span>{c.title}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="icon-btn" onClick={() => startEditCourse(c)}>تعديل</button>
              <button className="icon-btn" onClick={() => deleteCourse(c._id)}>حذف</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>2) اختار كورس تضيفله فيديوهات وامتحانات</h3>
        <select value={activeCourse || ""} onChange={(e) => setActiveCourse(e.target.value)}>
          <option value="">-- اختار كورس --</option>
          {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
      </div>

      {activeCourse && (
        <>
          <div className="card">
            <h3>3) {editingVideoId ? "تعديل الفيديو" : "إضافة فيديو للكورس"}</h3>

            {!editingVideoId && (
              <div style={{ display: "flex", gap: 16, margin: "10px 0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="radio" style={{ width: "auto" }}
                    checked={videoMode === "link"}
                    onChange={() => setVideoMode("link")} />
                  رابط يوتيوب / فيميو
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="radio" style={{ width: "auto" }}
                    checked={videoMode === "upload"}
                    onChange={() => setVideoMode("upload")} />
                  رفع ملف فيديو مباشرة
                </label>
              </div>
            )}

            {videoMode === "link" && (
              <p style={{ fontSize: 13, opacity: 0.8 }}>
                ارفع الفيديو على يوتيوب أو فيميو كـ "غير مدرج / Unlisted" (مش هيظهر في البحث ولا في قناتك للعامة)، وحط الرابط هنا.
              </p>
            )}
            {videoMode === "upload" && !editingVideoId && (
              <p style={{ fontSize: 13, opacity: 0.8 }}>
                هيترفع الفيديو مباشرة على Cloudinary. تأكد إن الملف mp4 أو webm أو mov وحجمه مناسب.
              </p>
            )}

            <form onSubmit={handleUploadVideo}>
              <input placeholder="عنوان الفيديو" required
                value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} />

              {(videoMode === "link" || editingVideoId) && (
                <input placeholder="رابط الفيديو (يوتيوب أو فيميو)" required type="url"
                  value={videoForm.videoUrl} onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })} />
              )}

              {videoMode === "upload" && !editingVideoId && (
                <input type="file" accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => setVideoFile(e.target.files[0])} required />
              )}

              <label style={{ marginTop: 8, display: "block" }}>ملف شرح مرفق (اختياري - رابط Google Drive مثلاً)</label>
              <input
                placeholder="عنوان الملف (مثلاً: ملخص الدرس)"
                value={videoForm.attachmentTitle}
                onChange={(e) => setVideoForm({ ...videoForm, attachmentTitle: e.target.value })}
              />
              <input
                placeholder="رابط الملف"
                type="url"
                value={videoForm.attachmentUrl}
                onChange={(e) => setVideoForm({ ...videoForm, attachmentUrl: e.target.value })}
              />

              {uploading && videoMode === "upload" && (
                <div style={{ margin: "8px 0" }}>
                  <div style={{ background: "var(--border)", borderRadius: 20, height: 10, overflow: "hidden" }}>
                    <div style={{
                      width: `${uploadProgress}%`, height: "100%",
                      background: "linear-gradient(135deg,#22c55e,#16a34a)", transition: "width .2s ease"
                    }} />
                  </div>
                  <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>جاري الرفع... {uploadProgress}%</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn" type="submit" disabled={uploading}>
                  {uploading ? "جاري الحفظ..." : editingVideoId ? "حفظ التعديل" : "إضافة الفيديو"}
                </button>
                {editingVideoId && <button type="button" className="btn secondary" onClick={resetVideoForm}>إلغاء</button>}
              </div>
            </form>

            {courseVideos.map((v) => (
              <div key={v._id} className="leaderboard-row">
                <span>🎬 {v.title}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="icon-btn" onClick={() => startEditVideo(v)}>تعديل</button>
                  <button className="icon-btn" onClick={() => deleteVideo(v._id)}>حذف</button>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>4) إنشاء امتحان</h3>
            <form onSubmit={handleCreateExam}>
              <input placeholder="عنوان الامتحان" required
                value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} />
              <label>مدة الامتحان (بالدقايق)</label>
              <input type="number" min={1} required
                value={examForm.durationMinutes}
                onChange={(e) => setExamForm({ ...examForm, durationMinutes: e.target.value })} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
                <input type="checkbox" style={{ width: "auto" }}
                  checked={examForm.isCompetitive}
                  onChange={(e) => setExamForm({ ...examForm, isCompetitive: e.target.checked })} />
                يدخل ضمن نظام المنافسة
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
                <input type="checkbox" style={{ width: "auto" }}
                  checked={examForm.isFinal}
                  onChange={(e) => setExamForm({ ...examForm, isFinal: e.target.checked })} />
                امتحان نهائي (يديله شهادة)
              </label>

              <label>متاح من (اختياري)</label>
              <input type="datetime-local"
                value={examForm.availableFrom}
                onChange={(e) => setExamForm({ ...examForm, availableFrom: e.target.value })} />

              <label>متاح لحد (اختياري - بعدها محدش يقدر يبدأ الامتحان)</label>
              <input type="datetime-local"
                value={examForm.availableUntil}
                onChange={(e) => setExamForm({ ...examForm, availableUntil: e.target.value })} />
              <p style={{ fontSize: 12, opacity: 0.7, marginTop: -6 }}>
                سيبهم فاضيين لو عايز الامتحان يفضل متاح على طول.
              </p>

              <button className="btn" type="submit" style={{ marginTop: 8 }}>إنشاء الامتحان</button>
            </form>
            {activeExam && (
              <p style={{ marginTop: 10 }}>
                <a href={`/teacher/grading/${activeExam}`} className="btn secondary" style={{ textDecoration: "none", display: "inline-block" }}>
                  ✍️ تصحيح الأسئلة المقالية
                </a>
                {" "}
                <button className="icon-btn" onClick={() => deleteExam(activeExam)}>حذف الامتحان ده</button>
              </p>
            )}
          </div>

          {activeExam && (
            <div className="card">
              <h3>5) {editingQuestionId ? "تعديل السؤال" : "إضافة أسئلة للامتحان"}</h3>
              <form onSubmit={handleSaveQuestion}>
                <label>نوع السؤال</label>
                <select value={qForm.type} onChange={(e) => {
                  const type = e.target.value;
                  if (type === "true_false") setQForm({ ...qForm, type, options: ["صح", "خطأ"], correctOptionIndex: 0 });
                  else if (type === "essay") setQForm({ ...qForm, type, options: [], correctOptionIndex: undefined });
                  else setQForm({ ...qForm, type, options: ["", ""], correctOptionIndex: 0 });
                }}>
                  <option value="multiple_choice">اختيار من متعدد</option>
                  <option value="true_false">صح / خطأ</option>
                  <option value="essay">مقالي (يتصحح يدويًا)</option>
                </select>

                <input placeholder="نص السؤال" required
                  value={qForm.text} onChange={(e) => setQForm({ ...qForm, text: e.target.value })} />

                {qForm.type === "multiple_choice" && qForm.options.map((opt, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="radio" style={{ width: "auto" }}
                      checked={qForm.correctOptionIndex === idx}
                      onChange={() => setQForm({ ...qForm, correctOptionIndex: idx })} />
                    <input placeholder={`اختيار ${idx + 1}`} required
                      value={opt} onChange={(e) => updateOption(idx, e.target.value)} />
                  </div>
                ))}
                {qForm.type === "multiple_choice" && (
                  <button type="button" className="btn secondary" style={{ marginTop: 6 }}
                    onClick={() => setQForm({ ...qForm, options: [...qForm.options, ""] })}>+ اختيار جديد</button>
                )}

                {qForm.type === "true_false" && (
                  <div style={{ display: "flex", gap: 16, margin: "10px 0" }}>
                    <label><input type="radio" style={{ width: "auto" }}
                      checked={qForm.correctOptionIndex === 0}
                      onChange={() => setQForm({ ...qForm, correctOptionIndex: 0 })} /> صح</label>
                    <label><input type="radio" style={{ width: "auto" }}
                      checked={qForm.correctOptionIndex === 1}
                      onChange={() => setQForm({ ...qForm, correctOptionIndex: 1 })} /> خطأ</label>
                  </div>
                )}

                <label>الدرجة</label>
                <input type="number" min={1}
                  value={qForm.points} onChange={(e) => setQForm({ ...qForm, points: e.target.value })} />

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button className="btn" type="submit">{editingQuestionId ? "حفظ التعديل" : "إضافة السؤال"}</button>
                  {editingQuestionId && <button type="button" className="btn secondary" onClick={resetQForm}>إلغاء</button>}
                </div>
              </form>
<div className="card" style={{ marginTop: 16 }}>
  <h4>📋 إضافة كذا سؤال دفعة واحدة (من نص)</h4>
  <p style={{ fontSize: 13, opacity: 0.8 }}>
    اكتب كل سؤال بالصيغة دي، وسيب سطر فاضي بين كل سؤال والتاني:
  </p>
 <pre style={{ fontSize: 12, background: "var(--bg)", padding: 10, borderRadius: 8, overflowX: "auto" }}>
{`س: عاصمة مصر إيه؟
1) القاهرة
2) الإسكندرية
3) الأقصر
4) أسوان
الإجابة: 1
الدرجة: 2

س: الأرض كروية
1) صح
2) خطأ
الإجابة: 1
الدرجة: 1`}
  </pre>
  <textarea
    rows={10}
    placeholder="الصق الأسئلة هنا..."
    value={bulkText}
    onChange={(e) => setBulkText(e.target.value)}
  />
  <button className="btn" onClick={handleBulkAdd} disabled={bulkLoading}>
    {bulkLoading ? "جاري الإضافة..." : "إضافة كل الأسئلة"}
  </button>
</div>
              {questions.map((q, i) => (
                <div key={q._id} className="leaderboard-row">
                  <span>{i + 1}. {q.text} <span className="badge">{q.type}</span></span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="icon-btn" onClick={() => startEditQuestion(q)}>تعديل</button>
                    <button className="icon-btn" onClick={() => deleteQuestion(q._id)}>حذف</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}