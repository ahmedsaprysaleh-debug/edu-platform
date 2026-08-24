import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../App";
import { useToast } from "../Toast";

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");

  useEffect(() => {
    loadCourse();
    loadComments();
    loadQuestions();
  }, [id]);

  const loadCourse = async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data);
      setEnrolled(res.data.enrolledStudents?.includes(user?._id));
    } catch (err) {
      showToast("فشل تحميل الكورس");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      // ✅ تصحيح: حذف /api المكررة
      const res = await api.get(`/courses/${id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error("فشل تحميل التعليقات:", err);
    }
  };

  const loadQuestions = async () => {
    try {
      // ✅ تصحيح: حذف /api المكررة
      const res = await api.get(`/courses/${id}/questions`);
      setQuestions(res.data);
    } catch (err) {
      console.error("فشل تحميل الأسئلة:", err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      showToast("اكتب تعليق!");
      return;
    }
    try {
      // ✅ تصحيح: حذف /api المكررة
      await api.post(`/courses/${id}/comments`, { text: newComment });
      setNewComment("");
      loadComments();
      showToast("تم إضافة التعليق ✅");
    } catch (err) {
      showToast(err.response?.data?.message || "فشل إضافة التعليق");
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) {
      showToast("اكتب سؤال!");
      return;
    }
    try {
      // ✅ تصحيح: حذف /api المكررة
      await api.post(`/courses/${id}/questions`, { text: newQuestion });
      setNewQuestion("");
      loadQuestions();
      showToast("تم إضافة السؤال ✅");
    } catch (err) {
      showToast(err.response?.data?.message || "فشل إضافة السؤال");
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      showToast("لازم تسجل دخول الأول!");
      return;
    }
    try {
      await api.post(`/courses/${id}/enroll`);
      setEnrolled(true);
      loadCourse();
      showToast("تم الاشتراك في الكورس ✅");
    } catch (err) {
      showToast(err.response?.data?.message || "فشل الاشتراك");
    }
  };

  if (loading) return <div className="container">جاري التحميل...</div>;
  if (!course) return <div className="container">الكورس غير موجود</div>;

  return (
    <div className="container">
      {/* معلومات الكورس */}
      <div className="card" style={{ marginBottom: "30px" }}>
        <h1 style={{ marginBottom: "10px" }}>{course.title}</h1>
        <p style={{ color: "var(--muted)", marginBottom: "20px" }}>{course.description}</p>
        
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <span className="badge">المدرس: {course.teacher?.name}</span>
          <span className="badge">{course.isFree ? "مجاني" : `${course.price} جنيه`}</span>
          <span className="badge">{course.enrolledStudents?.length || 0} طالب</span>
        </div>

        {!enrolled && (
          <button className="btn" onClick={handleEnroll} style={{ width: "100%" }}>
            اشترك في الكورس
          </button>
        )}
        {enrolled && (
          <div style={{ padding: "10px", background: "rgba(34, 197, 94, 0.1)", borderRadius: "10px", color: "#22c55e" }}>
            ✅ أنت مشترك في هذا الكورس
          </div>
        )}
      </div>

      {/* الفيديوهات والدروس */}
      {course.lessons && course.lessons.length > 0 && (
        <div className="card" style={{ marginBottom: "30px" }}>
          <h2>الدروس</h2>
          {course.lessons.map((lesson) => (
            <div key={lesson._id} style={{ padding: "15px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", marginBottom: "10px" }}>
              <h3 style={{ margin: "0 0 5px" }}>{lesson.title}</h3>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--muted)" }}>{lesson.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* الأسئلة */}
      <div className="card" style={{ marginBottom: "30px" }}>
        <h2>الأسئلة</h2>
        
        {enrolled && (
          <form onSubmit={handleAddQuestion} style={{ marginBottom: "20px" }}>
            <textarea
              placeholder="اسأل سؤال..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid var(--card-border)",
                background: "var(--input-bg)",
                color: "var(--text)",
                fontFamily: "inherit",
                minHeight: "80px",
                marginBottom: "10px",
              }}
            />
            <button type="submit" className="btn" style={{ width: "100%" }}>
              إضافة سؤال
            </button>
          </form>
        )}

        {questions.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center" }}>مفيش أسئلة لسه</p>
        ) : (
          questions.map((q) => (
            <div key={q._id} style={{
              padding: "12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "10px",
              marginBottom: "10px",
              borderRight: "3px solid var(--primary)",
            }}>
              <p style={{ margin: "0 0 5px", fontWeight: "500" }}>{q.student?.name}</p>
              <p style={{ margin: "0 0 8px" }}>{q.text}</p>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                {new Date(q.createdAt).toLocaleDateString("ar-EG")}
              </span>
            </div>
          ))
        )}
      </div>

      {/* التعليقات */}
      <div className="card">
        <h2>التعليقات</h2>
        
        {user && (
          <form onSubmit={handleAddComment} style={{ marginBottom: "20px" }}>
            <textarea
              placeholder="اكتب تعليق..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid var(--card-border)",
                background: "var(--input-bg)",
                color: "var(--text)",
                fontFamily: "inherit",
                minHeight: "80px",
                marginBottom: "10px",
              }}
            />
            <button type="submit" className="btn" style={{ width: "100%" }}>
              إضافة تعليق
            </button>
          </form>
        )}

        {comments.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center" }}>مفيش تعليقات لسه</p>
        ) : (
          comments.map((c) => (
            <div key={c._id} style={{
              padding: "12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "10px",
              marginBottom: "10px",
              borderRight: "3px solid var(--accent-2)",
            }}>
              <p style={{ margin: "0 0 5px", fontWeight: "500" }}>{c.user?.name}</p>
              <p style={{ margin: "0 0 8px" }}>{c.text}</p>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                {new Date(c.createdAt).toLocaleDateString("ar-EG")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}