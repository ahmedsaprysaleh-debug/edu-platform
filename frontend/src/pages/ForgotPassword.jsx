import { useState } from "react";
import api from "../api/axios";
import { useToast } from "../Toast";
import { useSettings } from "../AppSettings";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();
  const { t } = useSettings();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      showToast(data.message, "success");
      setSent(true);
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ", "error");
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: "40px auto" }}>
        <h2>{t("forgotPassword")}</h2>
        {sent ? (
          <p>لو الإيميل ده مسجل عندنا، هيوصلك رابط لإعادة تعيين الباسورد.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input type="email" placeholder={t("email")} required
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn" type="submit" style={{ width: "100%", marginTop: 10 }}>
              إرسال رابط إعادة التعيين
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
