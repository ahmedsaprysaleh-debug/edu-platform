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
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="كلمة المرور الجديدة"
              required
              minLength={6}
              style={{ width: "100%", paddingRight: 36, boxSizing: "border-box" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "إخفاء الباسورد" : "إظهار الباسورد"}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                padding: 4,
              }}
            >
              {showPassword ? "🙈" : "👁️"}
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