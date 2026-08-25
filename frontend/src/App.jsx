import { BrowserRouter, Routes, Route, Link, Navigate,useNavigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import api from "./api/axios";
import { AppSettingsProvider, useSettings } from "./AppSettings";
import { ToastProvider } from "./Toast";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import ExamPage from "./pages/ExamPage";
import Leaderboard from "./pages/Leaderboard";
import Payment from "./pages/Payment";
import Profile from "./pages/Profile";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherGrading from "./pages/TeacherGrading";
import AdminPanel from "./pages/AdminPanel";
import MyCourses from "./pages/MyCourses";
import About from "./pages/About";
import MyMistakes from "./pages/MyMistakes";
import StudentMistakes from "./pages/StudentMistakes";
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function VerifyBanner() {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  if (!user || user.isVerified) return null;

  const resend = async () => {
    try {
      await api.post("/auth/resend-verification");
      setSent(true);
    } catch {}
  };

  return (
    <div style={{ background: "#fef3c7", color: "#92400e", padding: "8px 20px", textAlign: "center", fontSize: 14 }}>
      حسابك لسه مش مفعّل، افتح إيميلك وفعّله.{" "}
      {!sent ? (
        <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={resend}>ابعتلي رابط تاني</span>
      ) : (
        "تم إرسال الرابط ✅"
      )}
    </div>
  );
}

function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const loadUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch {}
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch {}
  };

  useEffect(() => {
    if (!user) return;
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // كل 30 ثانية
    return () => clearInterval(interval);
  }, [user]);

  const handleToggle = () => {
    if (!open) loadNotifications();
    setOpen(!open);
  };

  const handleClickNotification = async (n) => {
    try {
      await api.patch(`/notifications/${n._id}/read`);
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - (n.read ? 0 : 1)));
    } catch {}
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  if (!user) return null;

  return (
    <div style={{ position: "relative" }}>
      <button className="icon-btn" onClick={handleToggle} title="الإشعارات" style={{ position: "relative" }}>
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4, background: "var(--danger)", color: "#fff",
            borderRadius: "50%", minWidth: 16, height: 16, fontSize: 10, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "0 3px", fontWeight: "bold",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, width: 300, maxHeight: 400,
            overflowY: "auto", background: "var(--card-bg)", border: "1px solid var(--border)",
            borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 999,
          }}>
            <div style={{
              padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex",
              justifyContent: "space-between", alignItems: "center",
            }}>
              <strong style={{ fontSize: 14 }}>الإشعارات</strong>
              {notifications.some((n) => !n.read) && (
                <span onClick={handleMarkAllRead} style={{ fontSize: 12, color: "var(--primary)", cursor: "pointer" }}>
                  تحديد الكل كمقروء
                </span>
              )}
            </div>

            {notifications.length === 0 ? (
              <p style={{ padding: 16, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                مفيش إشعارات لسه
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleClickNotification(n)}
                  style={{
                    padding: "10px 14px", borderBottom: "1px solid var(--border)", cursor: "pointer",
                    background: n.read ? "transparent" : "rgba(59,130,246,0.08)",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4 }}>{n.message}</p>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    {new Date(n.createdAt).toLocaleDateString("ar-EG")}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const { t, lang, theme, toggleLang, toggleTheme } = useSettings();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <>
      <nav className="navbar">
        {/* الاسم + اللغة + الإضاءة + الإشعارات على اليسار */}
        <div className="navbar-left">
          <Link to="/" style={{ fontWeight: "bold", fontSize: 18 }}>
            📚 {t("appName")}
          </Link>
          <button className="icon-btn" onClick={toggleLang} title="Language">
            {lang === "ar" ? "EN" : "AR"}
          </button>
          <button className="icon-btn" onClick={toggleTheme} title="Theme">
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <NotificationBell />
        </div>

        {/* زرار المينيو على اليمين */}
        <button
          className="icon-btn navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </nav>

      {/* Overlay (الخلفية الشفافة) */}
      <div 
        className={`navbar-overlay ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
      ></div>

      {/* الـ Sidebar (القائمة الجانبية) */}
      <div className={`navbar-drawer ${menuOpen ? "open" : ""}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>
          {t("courses")}
        </Link>
        {user?.role === "student" && (
          <Link to="/my-courses" onClick={() => setMenuOpen(false)}>
            كورساتي
          </Link>
        )}
        {user?.role === "student" && (
          <Link to="/my-mistakes" onClick={() => setMenuOpen(false)}>
            أسئلتي الغلط
          </Link>
        )}
        <Link to="/leaderboard" onClick={() => setMenuOpen(false)}>
          {t("leaderboard")}
        </Link>
        <Link to="/about" onClick={() => setMenuOpen(false)}>
          {t("about")}
        </Link>
        {user && (
          <Link to="/profile" onClick={() => setMenuOpen(false)}>
            {t("profile")}
          </Link>
        )}
        {(user?.role === "teacher" || user?.role === "admin") && (
          <Link to="/teacher" onClick={() => setMenuOpen(false)}>
            {t("teacherPanel")}
          </Link>
        )}
        {user?.role === "admin" && (
          <Link to="/admin" onClick={() => setMenuOpen(false)}>
            {t("admin")}
          </Link>
        )}

        <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "10px 0" }} />

        {user ? (
          <>
            <div style={{ padding: "8px 12px", textAlign: "center" }}>
              <span className="badge">
                {user.name}
                {user.role === "student" && ` - ${user.points} ${t("points")}`}
              </span>
            </div>
        <button 
  className="btn" 
  onClick={() => {
    handleLogout();
    setMenuOpen(false);
  }}
  style={{ width: "100%" }}
>
              {t("logout")}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              {t("login")}
            </Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}>
              {t("register")}
            </Link>
          </>
        )}
      </div>
    </>
  );
}
function AppInner() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useSettings();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) return <div className="container">{t("loading")}</div>;

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      <BrowserRouter>
        <Navbar />
        <a href="https://wa.me/+201027218581" target="_blank" rel="noreferrer" className="whatsapp-fab">💬</a>
        <VerifyBanner />
        <Routes>
        <Route path="/" element={user ? <Courses /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/exams/:examId" element={user ? <ExamPage /> : <Navigate to="/login" />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/payment/:courseId" element={user ? <Payment /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/my-courses" element={user ? <MyCourses /> : <Navigate to="/login" />} />
          <Route path="/my-mistakes" element={
            user?.role === "student" ? <MyMistakes /> : <Navigate to="/" />
          } />
          <Route path="/teacher" element={
            (user?.role === "teacher" || user?.role === "admin") ? <TeacherDashboard /> : <Navigate to="/" />
          } />
          <Route path="/teacher/grading/:examId" element={
            (user?.role === "teacher" || user?.role === "admin") ? <TeacherGrading /> : <Navigate to="/" />
          } />
          <Route path="/teacher/students/:studentId/mistakes" element={
            (user?.role === "teacher" || user?.role === "admin") ? <StudentMistakes /> : <Navigate to="/" />
          } />
          <Route path="/admin" element={user?.role === "admin" ? <AdminPanel /> : <Navigate to="/" />} />
        </Routes>
        <footer style={{ background: "var(--card-bg)", borderTop: "1px solid var(--border)", padding: "30px 20px", marginTop: 40, textAlign: "center" }}>
          <h3 style={{ margin: "0 0 8px", color: "var(--text)" }}>📚 {t ? t("appName") : "منصتي التعليمية"}</h3>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 16px" }}>
            منصة تعليمية شاملة لكل مراحل الدراسة
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 22 }}>
            <a href="#" style={{ textDecoration: "none" }}>📘</a>
            <a href="#" style={{ textDecoration: "none" }}>📸</a>
            <a href="#" style={{ textDecoration: "none" }}>🎵</a>
            <a href="#" style={{ textDecoration: "none" }}>▶️</a>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 20 }}>© 2026 جميع الحقوق محفوظة</p>
        </footer>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <AppSettingsProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AppSettingsProvider>
  );
}

export default App;