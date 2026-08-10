import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../Toast";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
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
          <input type="password" placeholder="كلمة المرور الجديدة" required minLength={6}
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn" type="submit" style={{ width: "100%", marginTop: 10 }}>
            حفظ الباسورد الجديد
          </button>
        </form>
      </div>
    </div>
  );
}
