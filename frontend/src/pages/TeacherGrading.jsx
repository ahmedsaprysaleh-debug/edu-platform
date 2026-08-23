import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../Toast";
import Spinner from "../components/Spinner";

export default function TeacherGrading() {
  const { examId } = useParams();
  const [submissions, setSubmissions] = useState(null);
  const [inputs, setInputs] = useState({}); // key -> نص الدرجة المكتوبة
  const [editingKey, setEditingKey] = useState(null); // مين السؤال المفتوح للتعديل دلوقتي
  const [savingKey, setSavingKey] = useState(null);
  const { showToast } = useToast();

  const load = () => {
    api.get(`/exams/${examId}/pending-grading`).then((res) => setSubmissions(res.data));
  };
  useEffect(load, [examId]);

  const grade = async (submissionId, questionId, awardedPoints) => {
    await api.patch(`/exams/submissions/${submissionId}/grade`, { questionId, awardedPoints });
  };

  const startEdit = (key, currentValue) => {
    setInputs({ ...inputs, [key]: currentValue != null ? String(currentValue) : "" });
    setEditingKey(key);
  };

  const cancelEdit = (key) => {
    setEditingKey(null);
    const rest = { ...inputs };
    delete rest[key];
    setInputs(rest);
  };

  const handleSave = async (key, submissionId, questionId, maxPoints) => {
    const raw = inputs[key];
    if (raw === undefined || raw.trim() === "") {
      return showToast("اكتب الدرجة الأول", "error");
    }
    const value = Number(raw);
    if (Number.isNaN(value) || value < 0 || value > maxPoints) {
      return showToast(`الدرجة لازم تكون رقم بين 0 و ${maxPoints}`, "error");
    }

    setSavingKey(key);
    try {
      await grade(submissionId, questionId, value);
      showToast("تم حفظ الدرجة ✅");
      setEditingKey(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ", "error");
    } finally {
      setSavingKey(null);
    }
  };

  if (!submissions) return <div className="container"><Spinner /></div>;

  return (
    <div className="container">
      <h2>✍️ تصحيح الأسئلة المقالية</h2>
      {submissions.length === 0 && <p>مفيش تسليمات فيها أسئلة مقالية لحد دلوقتي</p>}
      {submissions.map((s) => {
        const essayAnswers = s.answers.filter((a) => a.question?.type === "essay");
        if (essayAnswers.length === 0) return null;

        return (
          <div className="card" key={s._id}>
            <h3>{s.student?.name}</h3>
            {essayAnswers.map((a) => {
              const key = `${s._id}-${a.question._id}`;
              const isGraded = a.awardedPoints !== null;
              const isEditing = editingKey === key || !isGraded;

              return (
                <div key={a.question._id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                  <p><strong>{a.question.text}</strong></p>
                  <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{a.essayAnswer || "(مفيش إجابة)"}</p>

                  {!isEditing ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="badge">اتصححت: {a.awardedPoints} / {a.question.points}</span>
                      <button className="icon-btn" onClick={() => startEdit(key, a.awardedPoints)}>تعديل الدرجة</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        type="number" min={0} max={a.question.points}
                        style={{ width: 80, margin: 0 }}
                        value={inputs[key] ?? ""}
                        placeholder={`من ${a.question.points}`}
                        onChange={(e) => setInputs({ ...inputs, [key]: e.target.value })}
                      />
                      <button
                        className="btn"
                        disabled={savingKey === key}
                        onClick={() => handleSave(key, s._id, a.question._id, a.question.points)}
                      >
                        {savingKey === key ? "جاري الحفظ..." : "حفظ الدرجة"}
                      </button>
                      {isGraded && (
                        <button type="button" className="btn secondary" onClick={() => cancelEdit(key)}>إلغاء</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}