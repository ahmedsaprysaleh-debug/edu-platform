import { useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function Payment() {
  const { courseId } = useParams();
  const [method, setMethod] = useState("vodafone_cash");
  const [mobileNumber, setMobileNumber] = useState("");
  const [status, setStatus] = useState("");

  const handlePay = async () => {
    setStatus("جاري إرسال طلب الدفع...");
    try {
      const { data } = await api.post("/payments/initiate", {
        courseId, method, mobileNumber,
      });
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.iframeUrl) {
        window.location.href = data.iframeUrl;
      } else {
        setStatus("تم إرسال طلب الدفع، من المفروض توصلك رسالة تأكيد على موبايلك.");
      }
    } catch (err) {
      setStatus(err.response?.data?.message || "فشلت عملية الدفع");
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: "40px auto" }}>
        <h2>الدفع</h2>
        <label>اختار طريقة الدفع</label>
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="vodafone_cash">فودافون كاش</option>
          <option value="instapay">إنستاباي</option>
          <option value="card">بطاقة بنكية</option>
        </select>

        {method !== "card" && (
          <input
            placeholder="رقم المحفظة (01xxxxxxxxx)"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
          />
        )}

        <button className="btn" style={{ width: "100%", marginTop: 10 }} onClick={handlePay}>
          ادفع دلوقتي
        </button>
        {status && <p style={{ marginTop: 10 }}>{status}</p>}
      </div>
    </div>
  );
}
