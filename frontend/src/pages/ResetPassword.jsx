import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../Toast";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/reset-password", { token, password });
      showToast("تم تغيير كلمة المرور، سجّل دخول دلوقتي", "success");
      navigate("/login");
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ", "error");
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: "40px auto" }}>
        <h2>كلمة مرور جديدة</h2>
        <form onSubmit={handleSubmit}>
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
          <button className="btn" type="submit" style={{ width: "100%", marginTop: 10 }}>
            حفظ الباسورد الجديد
          </button>
        </form>
      </div>
    </div>
  );
}