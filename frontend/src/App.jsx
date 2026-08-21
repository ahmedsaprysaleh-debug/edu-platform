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

function Navbar() {
  const { user, logout } = useAuth();
  const { t, lang, theme, toggleLang, toggleTheme } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
<Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
  <img src="/logo-icon.svg" alt="لوجو" style={{ width: 30, height: 30 }} />
  <span style={{ fontWeight: "bold", fontSize: 18, color: "var(--text)" }}>{t("appName")}</span>
</Link>      <div style={{ display: "flex", alignItems: "center" }}>
      <Link to="/">{t("courses")}</Link>
{user?.role === "student" && <Link to="/my-courses">كورساتي</Link>}
<Link to="/leaderboard">{t("leaderboard")}</Link>
<Link to="/about">{t("about")}</Link>
{user && <Link to="/profile">{t("profile")}</Link>}
{(user?.role === "teacher" || user?.role === "admin") && <Link to="/teacher">{t("teacherPanel")}</Link>}
{user?.role === "admin" && <Link to="/admin">{t("admin")}</Link>}
        <button className="icon-btn" onClick={toggleLang}>{lang === "ar" ? "EN" : "AR"}</button>
        <button className="icon-btn" onClick={toggleTheme}>{theme === "light" ? "🌙" : "☀️"}</button>

        {user ? (
          <>
<span className="badge" style={{ marginInlineStart: 10 }}>
  {user.name}{user.role === "student" && ` - ${user.points} ${t("points")}`}
</span>
            <button className="btn" style={{ marginInlineStart: 10 }} onClick={handleLogout}>{t("logout")}</button>
          </>
        ) : (
          <>
            <Link to="/login">{t("login")}</Link>
            <Link to="/register">{t("register")}</Link>
          </>
        )}
      </div>
    </nav>
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
          <Route path="/teacher" element={
            (user?.role === "teacher" || user?.role === "admin") ? <TeacherDashboard /> : <Navigate to="/" />
          } />
          <Route path="/teacher/grading/:examId" element={
            (user?.role === "teacher" || user?.role === "admin") ? <TeacherGrading /> : <Navigate to="/" />
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
