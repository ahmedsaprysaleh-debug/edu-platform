import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../App";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", teacherInviteCode: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/register", form);
      localStorage.setItem("token", data.token);
      setUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "حصل خطأ");
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: "40px auto" }}>
        <h2>إنشاء حساب</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input placeholder="الاسم" required
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input type="email" placeholder="الإيميل" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

<div style={{ position: "relative", marginBottom: "12px" }}>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="الباسورد"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    style={{
      width: "100%",
      padding: "10px 45px 10px 10px",  // ← تغيير
      margin: "6px 0",
      borderRadius: "10px",
      border: "1px solid var(--card-border)",
      background: "var(--input-bg)",
      backdropFilter: "blur(var(--blur))",
      color: "var(--text)",
      fontFamily: "inherit",
      fontSize: "15px",
      boxSizing: "border-box",  // ← أضيف هذا
    }}
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "10px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "20px",
      color: "var(--text)",
      padding: "0",
      zIndex: "10",  // ← أضيف هذا
      pointerEvents: "auto",  // ← أضيف هذا
    }}
  >
    {showPassword ? "👁️" : "🙈"}
  </button>
</div>

          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="student">طالب</option>
            <option value="teacher">مدرّس</option>
          </select>
          {form.role === "teacher" && (
            <input placeholder="كود دعوة المدرّس" required
              value={form.teacherInviteCode}
              onChange={(e) => setForm({ ...form, teacherInviteCode: e.target.value })} />
          )}
          <button className="btn" type="submit" style={{ width: "100%", marginTop: 10 }}>تسجيل</button>
        </form>
        <p style={{ marginTop: 12 }}>عندك حساب؟ <Link to="/login">دخول</Link></p>
      </div>
    </div>
  );
}