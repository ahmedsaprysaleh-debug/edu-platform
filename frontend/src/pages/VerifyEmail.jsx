import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("جاري التفعيل...");

  useEffect(() => {
    api.get(`/auth/verify-email/${token}`)
      .then((res) => setStatus(res.data.message))
      .catch((err) => setStatus(err.response?.data?.message || "حصل خطأ"));
  }, [token]);

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 400, margin: "40px auto", textAlign: "center" }}>
        <h2>{status}</h2>
        <Link className="btn" to="/">الرجوع للرئيسية</Link>
      </div>
    </div>
  );
}
