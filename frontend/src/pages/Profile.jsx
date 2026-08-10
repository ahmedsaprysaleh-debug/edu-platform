import { useEffect, useState } from "react";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import { useToast } from "../Toast";

export default function Profile() {
  const [data, setData] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    api.get("/profile/me").then((res) => setData(res.data));
  }, []);

  const downloadCertificate = async (courseId, courseTitle) => {
    try {
      const res = await api.get(`/certificates/${courseId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${courseTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast("فشل تحميل الشهادة", "error");
    }
  };

  if (!data) return <div className="container"><Spinner /></div>;

  return (
    <div className="container">
      <div className="card">
        <h2>{data.user.name}</h2>
        <p style={{ opacity: 0.7, fontSize: 14 }}>{data.user.email}</p>
        {data.user.role === "student" && (
          <p className="badge">{data.user.points} نقطة</p>
        )}
      </div>

      {data.certificates.length > 0 && (
        <div className="card">
          <h3>🎓 الشهادات</h3>
          {data.certificates.map((c) => (
            <div key={c._id} className="leaderboard-row">
              <span>✅ {c.title}</span>
              <button className="icon-btn" onClick={() => downloadCertificate(c._id, c.title)}>
                تحميل PDF
              </button>
            </div>
          ))}
        </div>
      )}

      {data.user.role === "student" && (
        <>
          <div className="card">
            <h3>📝 سجل الامتحانات</h3>
            {data.submissions.length === 0 && <p>لسه معملتش أي امتحان.</p>}
            {data.submissions.map((s) => (
              <div key={s._id} className="leaderboard-row">
                <span>{s.exam?.title} ({s.exam?.course?.title})</span>
                <span className="badge">{s.score} / {s.totalPoints}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3>💳 سجل المدفوعات</h3>
            {data.payments.length === 0 && <p>مفيش مدفوعات لسه.</p>}
            {data.payments.map((p) => (
              <div key={p._id} className="leaderboard-row">
                <span>{p.course?.title} — {p.method}</span>
                <span className="badge">
                  {p.amount} جنيه • {p.status === "paid" ? "تم الدفع ✅" : p.status === "pending" ? "قيد الانتظار" : "فشل ❌"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}