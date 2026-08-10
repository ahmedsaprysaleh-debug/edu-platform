import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../App";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", teacherInviteCode: "" });
  const [error, setError] = useState("");
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
          <input type="password" placeholder="الباسورد" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
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
