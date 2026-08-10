import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../Toast";
import Spinner from "../components/Spinner";

export default function TeacherGrading() {
  const { examId } = useParams();
  const [submissions, setSubmissions] = useState(null);
  const { showToast } = useToast();

  const load = () => {
    api.get(`/exams/${examId}/pending-grading`).then((res) => setSubmissions(res.data));
  };
  useEffect(load, [examId]);

  const grade = async (submissionId, questionId, awardedPoints) => {
    try {
      await api.patch(`/exams/submissions/${submissionId}/grade`, { questionId, awardedPoints: Number(awardedPoints) });
      showToast("تم حفظ الدرجة ✅");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ", "error");
    }
  };

  if (!submissions) return <div className="container"><Spinner /></div>;

  return (
    <div className="container">
      <h2>✍️ تصحيح الأسئلة المقالية</h2>
      {submissions.length === 0 && <p>مفيش إجابات محتاجة تصحيح دلوقتي 🎉</p>}
      {submissions.map((s) => (
        <div className="card" key={s._id}>
          <h3>{s.student?.name}</h3>
          {s.answers.filter((a) => a.question?.type === "essay").map((a) => (
            <div key={a.question._id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
              <p><strong>{a.question.text}</strong></p>
              <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{a.essayAnswer || "(مفيش إجابة)"}</p>
              {a.awardedPoints !== null ? (
                <span className="badge">اتصححت: {a.awardedPoints} / {a.question.points}</span>
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number" min={0} max={a.question.points}
                    style={{ width: 80, margin: 0 }}
                    id={`grade-${s._id}-${a.question._id}`}
                    placeholder={`من ${a.question.points}`}
                  />
                  <button
                    className="btn"
                    onClick={() => {
                      const val = document.getElementById(`grade-${s._id}-${a.question._id}`).value;
                      if (val === "") return showToast("اكتب الدرجة الأول", "error");
                      grade(s._id, a.question._id, val);
                    }}
                  >
                    حفظ الدرجة
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
