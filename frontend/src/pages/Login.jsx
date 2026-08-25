import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../App";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setResendMsg("");
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("token", data.token);
      setUser(data.user);

      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "teacher") {
        navigate("/teacher");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "حصل خطأ");
      if (err.response?.data?.needsVerification) {
        setNeedsVerification(true);
      }
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg("");
    try {
      const { data } = await api.post("/auth/resend-verification-by-email", { email: form.email });
      setResendMsg(data.message || "تم إرسال إيميل تفعيل جديد، افتح بريدك");
    } catch (err) {
      setResendMsg(err.response?.data?.message || "حصل خطأ في إرسال الإيميل");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: "40px auto" }}>
        <h2>تسجيل الدخول</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}

        {needsVerification && (
          <div style={{ margin: "10px 0" }}>
            <button
              type="button"
              className="btn secondary"
              onClick={handleResend}
              disabled={resending || !form.email}
              style={{ width: "100%" }}
            >
              {resending ? "جاري الإرسال..." : "ابعتلي رابط تفعيل تاني"}
            </button>
            {resendMsg && <p style={{ fontSize: 13, marginTop: 6 }}>{resendMsg}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="الإيميل" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

<div style={{ position: "relative", width: "100%" }}>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="الباسورد"
    required
    style={{
      width: "100%",
      paddingLeft: "40px",  /* مساحة كافية للأيقونة على اليسار */
      paddingRight: "12px",
      boxSizing: "border-box"
    }}
    value={form.password}
    onChange={(e) => setForm({ ...form, password: e.target.value })}
  />
  <button
    type="button"
    onClick={() => setShowPassword((v) => !v)}
    aria-label={showPassword ? "إخفاء الباسورد" : "إظهار الباسورد"}
    style={{
      position: "absolute",
      left: "10px",          /* تثبيت على اليسار بدلاً من اليمين */
      right: "auto",
      top: "50%",
      transform: "translateY(-50%)",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      fontSize: "16px",
      lineHeight: 1,
      padding: 0,
      width: "auto",         /* إلغاء width: 100% الخاص بالـ CSS العام */
      minWidth: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2
    }}
  >
    {showPassword ? "🙈" : "👁️"}
  </button>
</div>

          <button className="btn" type="submit" style={{ width: "100%", marginTop: 10 }}>دخول</button>
        </form>
        <p style={{ marginTop: 12 }}>مالكش حساب؟ <Link to="/register">اعمل حساب</Link></p>
        <p><Link to="/forgot-password">نسيت الباسورد؟</Link></p>
      </div>
    </div>
  );
}