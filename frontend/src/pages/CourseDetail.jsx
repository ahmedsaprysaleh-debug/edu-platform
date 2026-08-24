import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import { useToast } from "../Toast";
import { useAuth } from "../App";

// ===== QUESTIONS & COMMENTS SECTION =====
function CommentReplyForm({ commentId, onReplyAdded }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleReply = async () => {
    if (!text.trim()) return showToast("اكتب الرد أولاً", "error");
    setLoading(true);
    try {
      const res = await api.post(`/videos/comments/${commentId}/reply`, { text });
      showToast("تم إضافة الرد ✅");
      setText("");
      onReplyAdded(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ في إضافة الرد", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="اكتب ردك كمدرّس..."
        style={{
          flex: 1,
          padding: 8,
          borderRadius: 6,
          border: "1px solid var(--border)",
          backgroundColor: "var(--input-bg)",
          color: "var(--text)",
          fontSize: 13,
        }}
      />
      <button
        className="btn"
        onClick={handleReply}
        disabled={loading || !text.trim()}
        style={{ padding: "8px 14px", fontSize: 13, whiteSpace: "nowrap" }}
      >
        {loading ? "..." : "رد"}
      </button>
    </div>
  );
}

function QuestionsSection({ videoId, videoTitle }) {
  const [activeTab, setActiveTab] = useState("questions"); // questions | comments
  const [questions, setQuestions] = useState([]);
  const [comments, setComments] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newComment, setNewComment] = useState("");
  const [loadingQ, setLoadingQ] = useState(false);
  const [loadingC, setLoadingC] = useState(false);
  const [openReplyFor, setOpenReplyFor] = useState(null); // commentId اللي فورم الرد بتاعه مفتوح
  const { user } = useAuth();
  const { showToast } = useToast();

  const canReply = user && (user.role === "teacher" || user.role === "admin");

  useEffect(() => {
    loadQuestions();
    loadComments();
  }, [videoId]);

  const loadQuestions = async () => {
    try {
      const res = await api.get(`/videos/${videoId}/questions`);
      setQuestions(res.data || []);
    } catch (err) {
      console.log("فيه مشكلة في جلب الأسئلة");
    }
  };

  const loadComments = async () => {
    try {
      const res = await api.get(`/videos/${videoId}/comments`);
      setComments(res.data || []);
    } catch (err) {
      console.log("فيه مشكلة في جلب التعليقات");
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return showToast("اكتب السؤال أولاً", "error");
    if (!user) return showToast("لازم تكون مسجل دخول", "error");

    setLoadingQ(true);
    try {
      await api.post(`/videos/${videoId}/questions`, { text: newQuestion });
      showToast("تم إضافة السؤال ✅");
      setNewQuestion("");
      loadQuestions();
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ في إضافة السؤال", "error");
    } finally {
      setLoadingQ(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return showToast("اكتب تعليقك أولاً", "error");
    if (!user) return showToast("لازم تكون مسجل دخول", "error");

    setLoadingC(true);
    try {
      await api.post(`/videos/${videoId}/comments`, { text: newComment });
      showToast("تم إضافة التعليق ✅");
      setNewComment("");
      loadComments();
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ في إضافة التعليق", "error");
    } finally {
      setLoadingC(false);
    }
  };

  const handleReplyAdded = (updatedComment) => {
    setComments((prev) => prev.map((c) => (c._id === updatedComment._id ? updatedComment : c)));
    setOpenReplyFor(null);
  };

  return (
    <div className="card" style={{ marginTop: 16, borderLeft: "4px solid #3b82f6" }}>
      {/* التابات */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={() => setActiveTab("questions")}
          style={{
            flex: 1, padding: "10px 8px", background: "none", border: "none",
            borderBottom: activeTab === "questions" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "questions" ? "var(--primary)" : "var(--muted)",
            fontWeight: activeTab === "questions" ? "700" : "500", cursor: "pointer", fontSize: 14,
          }}
        >
          💬 أسئلة ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          style={{
            flex: 1, padding: "10px 8px", background: "none", border: "none",
            borderBottom: activeTab === "comments" ? "3px solid var(--primary)" : "3px solid transparent",
            color: activeTab === "comments" ? "var(--primary)" : "var(--muted)",
            fontWeight: activeTab === "comments" ? "700" : "500", cursor: "pointer", fontSize: 14,
          }}
        >
          📝 تعليقات ({comments.length})
        </button>
      </div>

      {/* قسم الأسئلة */}
      {activeTab === "questions" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="اسأل سؤالك هنا..."
              style={{
                width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border)",
                backgroundColor: "var(--input-bg)", color: "var(--text)", minHeight: 80,
                fontSize: 14, fontFamily: "inherit", resize: "vertical",
              }}
            />
            <button className="btn" onClick={handleAddQuestion} disabled={loadingQ || !newQuestion.trim()}
              style={{ marginTop: 8, width: "100%" }}>
              {loadingQ ? "جاري الإضافة..." : "أضيف السؤال"}
            </button>
          </div>

          {questions.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>لا توجد أسئلة حتى الآن</p>
          ) : (
            <div>
              {questions.map((q) => (
                <div key={q._id} style={{
                  padding: 12, marginBottom: 12, background: "var(--input-bg)",
                  borderRadius: 8, borderRight: "3px solid #3b82f6",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong style={{ fontSize: 14 }}>{q.userName || "مستخدم"}</strong>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      {new Date(q.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{q.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* قسم التعليقات */}
      {activeTab === "comments" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="اكتب تعليقك على الفيديو..."
              style={{
                width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border)",
                backgroundColor: "var(--input-bg)", color: "var(--text)", minHeight: 80,
                fontSize: 14, fontFamily: "inherit", resize: "vertical",
              }}
            />
            <button className="btn" onClick={handleAddComment} disabled={loadingC || !newComment.trim()}
              style={{ marginTop: 8, width: "100%" }}>
              {loadingC ? "جاري الإضافة..." : "أضيف تعليق"}
            </button>
          </div>

          {comments.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>لا توجد تعليقات حتى الآن</p>
          ) : (
            <div>
              {comments.map((c) => (
                <div key={c._id} style={{
                  padding: 12, marginBottom: 12, background: "var(--input-bg)",
                  borderRadius: 8, borderRight: "3px solid #22c55e",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong style={{ fontSize: 14 }}>{c.userName || "مستخدم"}</strong>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      {new Date(c.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{c.text}</p>

                  {/* الردود */}
                  {c.replies && c.replies.length > 0 && (
                    <div style={{ marginTop: 10, paddingRight: 14, borderRight: "2px solid var(--border)" }}>
                      {c.replies.map((r, idx) => (
                        <div key={idx} style={{
                          marginTop: idx === 0 ? 0 : 8, padding: 10,
                          background: r.isTeacherReply ? "rgba(59,130,246,0.08)" : "var(--card-bg, transparent)",
                          borderRadius: 6,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <strong style={{ fontSize: 13, color: r.isTeacherReply ? "#3b82f6" : "inherit" }}>
                              {r.isTeacherReply && "👨‍🏫 "}{r.userName}
                            </strong>
                            <span style={{ fontSize: 11, color: "var(--muted)" }}>
                              {new Date(r.createdAt).toLocaleDateString("ar-EG")}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{r.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* زرار وفورم الرد - للمدرّس/الأدمن بس */}
                  {canReply && (
                    openReplyFor === c._id ? (
                      <CommentReplyForm commentId={c._id} onReplyAdded={handleReplyAdded} />
                    ) : (
                      <button
                        onClick={() => setOpenReplyFor(c._id)}
                        style={{
                          marginTop: 8, background: "none", border: "none", color: "var(--primary)",
                          fontSize: 13, cursor: "pointer", padding: 0,
                        }}
                      >
                        رد كمدرّس
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function toEmbedUrl(url) {
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1].split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes("youtube.com/watch")) {
    const id = new URL(url).searchParams.get("v");
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes("vimeo.com/")) {
    const id = url.split("vimeo.com/")[1].split(/[?&]/)[0];
    return `https://player.vimeo.com/video/${id}`;
  }
  return url;
}

function ProtectedVideo({ video, onWatched }) {
  const [streamUrl, setStreamUrl] = useState(null);
  const marked = useState(false)[0]; // مش محتاجين setter هنا

  useEffect(() => {
    api.post(`/videos/${video._id}/token`).then((res) => {
      const url = res.data.streamUrl;
      setStreamUrl(url.startsWith("http") ? url : `${api.defaults.baseURL.replace("/api", "")}${url}`);
    });
  }, [video._id]);

  const handlePlay = () => {
    if (!video.watched) onWatched(video._id);
  };

  const isEmbed = streamUrl && (streamUrl.includes("youtu") || streamUrl.includes("vimeo"));

  return (
    <div className="card">
      <h4>{video.title} {video.watched && <span style={{ color: "#16a34a" }}>✅ اتفرجت عليه</span>}</h4>
      {streamUrl ? (
        isEmbed ? (
          <iframe
            src={toEmbedUrl(streamUrl)}
            allow="autoplay; fullscreen"
            allowFullScreen
            onLoad={handlePlay}
            style={{ width: "100%", aspectRatio: "16/9", border: 0, borderRadius: 8 }}
          />
        ) : (
          <video
            src={streamUrl}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            onPlay={handlePlay}
            style={{ width: "100%", borderRadius: 8 }}
          />
        )
      ) : <Spinner />}
      {video.attachmentUrl && (
        <a
          href={video.attachmentUrl}
          target="_blank"
          rel="noreferrer"
          className="btn secondary"
          style={{ display: "inline-block", marginTop: 10, textDecoration: "none" }}
        >
          📎 {video.attachmentTitle || "تحميل ملف الشرح"}
        </a>
      )}
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [locked, setLocked] = useState(false);
  const [lockedReason, setLockedReason] = useState(""); // "enroll" | "payment"
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const { showToast } = useToast();

  const loadVideos = () => {
    setLocked(false);
    api.get(`/courses/${id}/videos`)
      .then((res) => {
        setVideos(res.data);
        setLocked(false);
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          setLocked(true);
          setLockedReason(err.response.data?.needsEnroll ? "enroll" : "payment");
        }
      });
  };

  // نتأكد من حالة الاشتراك الحقيقية من السيرفر (مش state محلي بيتصفّر كل ما الصفحة تتفتح تاني)
  const loadEnrollmentStatus = () => {
    api.get("/courses/my")
      .then((res) => {
        const isEnrolled = (res.data || []).some((c) => c._id === id);
        setEnrolled(isEnrolled);
      })
      .catch(() => {});
  };

  useEffect(() => {
    api.get(`/courses/${id}`).then((res) => setCourse(res.data));
    loadEnrollmentStatus();
    loadVideos();
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      showToast("تم الاشتراك في الكورس ✅");
      setEnrolled(true);
      loadVideos(); // نحاول نجيب الفيديوهات تاني دلوقتي بعد ما بقى مشترك
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ", "error");
    } finally {
      setEnrolling(false);
    }
  };

  const handleWatched = async (videoId) => {
    try {
      await api.post(`/videos/${videoId}/watched`);
      setVideos((prev) => prev.map((v) => (v._id === videoId ? { ...v, watched: true } : v)));
    } catch {}
  };

    if (!course) return <div className="container"><Spinner /></div>;

  const watchedCount = videos.filter((v) => v.watched).length;
  const progressPercent = videos.length > 0 ? Math.round((watchedCount / videos.length) * 100) : 0;

  return (
    <div className="container">
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {course.coverImageFilename && (
          <img
            src={course.coverImageFilename}
            alt={course.title}
            style={{
              width: "100%",
              height: 220,
              objectFit: "cover",
              display: "block",
            }}
          />
        )}
        <div style={{ padding: 16 }}>
          <h2>{course.title}</h2>
          <p>{course.description}</p>
          <p>{course.isFree ? "مجاني" : `${course.price} جنيه`}</p>

          {course.isFree && !enrolled && (
            <button className="btn" onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? "جاري الاشتراك..." : "اشترك في الكورس"}
            </button>
          )}
          {enrolled && <p style={{ color: "#16a34a" }}>✅ انت مشترك في الكورس ده</p>}

          {locked && lockedReason === "payment" && (
            <>
              <p style={{ color: "var(--danger)" }}>🔒 لازم تدفع تمن الكورس عشان تشوف الفيديوهات</p>
              <Link className="btn" to={`/payment/${course._id}`}>ادفع دلوقتي</Link>
            </>
          )}
          {locked && lockedReason === "enroll" && (
            <p style={{ color: "var(--danger)" }}>🔒 اشترك في الكورس الأول عشان تقدر تشوف الفيديوهات</p>
          )}

          {videos.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p className="muted">تقدمك: {watchedCount} من {videos.length} فيديو ({progressPercent}%)</p>
              <div style={{ background: "var(--border)", borderRadius: 20, height: 10, overflow: "hidden" }}>
                <div style={{
                  width: `${progressPercent}%`, height: "100%",
                  background: "linear-gradient(135deg,#22c55e,#16a34a)", transition: "width .3s ease"
                }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {videos.map((v) => (
        <div key={v._id}>
          <ProtectedVideo video={v} onWatched={handleWatched} />
          <QuestionsSection videoId={v._id} videoTitle={v.title} />
        </div>
      ))}
    </div>
  );
}