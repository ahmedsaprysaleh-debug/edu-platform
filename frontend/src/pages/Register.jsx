import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../App";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    teacherInviteCode: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين ❌");
      return;
    }

    setSubmitting(true);

    const cleanForm = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      teacherInviteCode: form.role === "teacher" ? form.teacherInviteCode.trim() : undefined,
    };

    try {
      const { data } = await api.post("/auth/register", cleanForm);
      localStorage.setItem("token", data.token);
      setUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "حصل خطأ في إنشاء الحساب");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: "40px auto" }}>
        <h2>إنشاء حساب</h2>

        {error && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "var(--danger, #ef4444)",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "14px",
              marginBottom: "16px",
              borderRight: "4px solid var(--danger, #ef4444)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* الاسم */}
          <div style={{ marginBottom: "12px" }}>
            <input
              placeholder="الاسم الكامل"
              required
              style={{ width: "100%", boxSizing: "border-box" }}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* البريد الإلكتروني */}
          <div style={{ marginBottom: "12px" }}>
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              required
              style={{ width: "100%", boxSizing: "border-box" }}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* كلمة المرور */}
          <div style={{ position: "relative", width: "100%", marginBottom: "12px" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="كلمة المرور"
              required
              minLength={6}
              style={{
                width: "100%",
                paddingLeft: "40px",
                paddingRight: "12px",
                boxSizing: "border-box",
              }}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                padding: 0,
                zIndex: 2,
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* تأكيد كلمة المرور */}
          <div style={{ position: "relative", width: "100%", marginBottom: "12px" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="تأكيد كلمة المرور"
              required
              minLength={6}
              style={{
                width: "100%",
                paddingLeft: "40px",
                paddingRight: "12px",
                boxSizing: "border-box",
              }}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? "إخفاء تأكيد كلمة المرور" : "إظهار تأكيد كلمة المرور"}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "18px",
                padding: 0,
                zIndex: 2,
              }}
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* نوع الحساب */}
          <div style={{ marginBottom: "12px" }}>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{ width: "100%", boxSizing: "border-box" }}
            >
              <option value="student">طالب</option>
              <option value="teacher">مدرّس</option>
            </select>
          </div>

          {/* كود دعوة المدرّس */}
          {form.role === "teacher" && (
            <div style={{ marginBottom: "12px" }}>
              <input
                placeholder="كود دعوة المدرّس"
                required
                style={{ width: "100%", boxSizing: "border-box" }}
                value={form.teacherInviteCode}
                onChange={(e) => setForm({ ...form, teacherInviteCode: e.target.value })}
              />
            </div>
          )}

          <button
            className="btn"
            type="submit"
            disabled={submitting}
            style={{ width: "100%", marginTop: 10 }}
          >
            {submitting ? "جاري التسجيل..." : "تسجيل"}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 14 }}>
          لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}