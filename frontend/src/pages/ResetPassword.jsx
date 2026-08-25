import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../Toast";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast("كلمتا المرور غير متطابقتين ❌", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      showToast("تم تغيير كلمة المرور بنجاح، سجل دخولك الآن ✅", "success");
      navigate("/login");
    } catch (err) {
      showToast(
        err.response?.data?.message || "حصل خطأ في إعادة تعيين كلمة المرور",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: "40px auto" }}>
        <h2>كلمة مرور جديدة</h2>
        <form onSubmit={handleSubmit}>
          {/* حقل كلمة المرور الجديدة */}
          <div style={{ position: "relative", marginBottom: "12px", width: "100%" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="كلمة المرور الجديدة"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: "100%",
                paddingLeft: "40px",
                paddingRight: "12px",
                borderRadius: "10px",
                border: "1px solid var(--card-border)",
                background: "var(--input-bg)",
                backdropFilter: "blur(var(--blur))",
                color: "var(--text)",
                fontFamily: "inherit",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
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
                padding: "0",
                zIndex: 2,
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* حقل تأكيد كلمة المرور */}
          <div style={{ position: "relative", marginBottom: "12px", width: "100%" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="تأكيد كلمة المرور الجديدة"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: "100%",
                paddingLeft: "40px",
                paddingRight: "12px",
                borderRadius: "10px",
                border: "1px solid var(--card-border)",
                background: "var(--input-bg)",
                backdropFilter: "blur(var(--blur))",
                color: "var(--text)",
                fontFamily: "inherit",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                padding: "0",
                zIndex: 2,
              }}
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            className="btn"
            type="submit"
            disabled={submitting}
            style={{ width: "100%", marginTop: 10 }}
          >
            {submitting ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
          </button>
        </form>
      </div>
    </div>
  );
}