import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../App";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
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
        <h2>تسجيل الدخول</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="الإيميل" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" placeholder="الباسورد" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn" type="submit" style={{ width: "100%", marginTop: 10 }}>دخول</button>
        </form>
        <p style={{ marginTop: 12 }}>مالكش حساب؟ <Link to="/register">اعمل حساب</Link></p>
        <p><Link to="/forgot-password">نسيت الباسورد؟</Link></p>
      </div>
    </div>
  );
}
