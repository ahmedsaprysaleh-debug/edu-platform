import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function ExamPage() {
  const { examId } = useParams();
  const [examTitle, setExamTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [error, setError] = useState("");
  const [tabWarning, setTabWarning] = useState(0);
  const submittingRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, ans]) => ({
          questionId,
          selectedOptionIndex: ans.selectedOptionIndex,
          essayAnswer: ans.essayAnswer,
        })),
      };
      const { data } = await api.post(`/exams/${examId}/submit`, payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "حصل خطأ في التسليم");
      submittingRef.current = false;
    }
  }, [answers, examId]);

  // بدء الامتحان: الأسئلة والاختيارات بترجع من السيرفر جاهزة ومخلوطة خصيصًا لهذا الطالب
  useEffect(() => {
    api.post(`/exams/${examId}/start`).then(({ data }) => {
      setExamTitle(data.examTitle || "");
      setQuestions(data.questions);
      const startedAt = new Date(data.startedAt).getTime();
      const totalAllowed = data.durationMinutes * 60;
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemainingSeconds(Math.max(totalAllowed - elapsed, 0));
    }).catch((err) => setError(err.response?.data?.message || "حصل خطأ"));
  }, [examId]);

  // التايمر
  useEffect(() => {
    if (remainingSeconds === null || result) return;
    if (remainingSeconds <= 0) { handleSubmit(); return; }
    const timer = setTimeout(() => setRemainingSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [remainingSeconds, result, handleSubmit]);

  // منع الغش: لو الطالب سرّح من التاب وقت الامتحان، بنسجلها ونحذّره
  useEffect(() => {
    if (result) return;
    const onVisibilityChange = () => {
      if (document.hidden) {
        api.post(`/exams/${examId}/tab-switch`).catch(() => {});
        setTabWarning((w) => w + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [examId, result]);

  const selectAnswer = (questionId, optionIndex) => {
    setAnswers({ ...answers, [questionId]: { selectedOptionIndex: optionIndex } });
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (error && !result) {
    return <div className="container"><div className="card" style={{ color: "var(--danger)" }}>{error}</div></div>;
  }

  if (questions.length === 0 || remainingSeconds === null) return <div className="container">جاري التحميل...</div>;

  if (result) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: "center", padding: 30 }}>
          <h2>🎉 تم تسليم الامتحان</h2>
          <p style={{ fontSize: 20, margin: "10px 0" }}>الطالب: <strong>{result.studentName}</strong></p>
          <p style={{ fontSize: 32, fontWeight: "bold", color: "var(--primary)", margin: "16px 0" }}>
            {result.score} / {result.totalPoints}
          </p>
          {result.needsManualGrading && (
            <p className="badge" style={{ background: "#fef3c7", color: "#92400e" }}>
              ⏳ فيه أسئلة مقالية لسه محتاجة تصحيح المدرّس - درجتك النهائية هتتحدث بعدين
            </p>
          )}
          <p className="muted">{result.examTitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {tabWarning > 0 && (
        <div className="card" style={{ background: "var(--danger-bg)", color: "var(--danger)", fontSize: 14 }}>
          ⚠️ تم رصد خروجك من صفحة الامتحان {tabWarning} مرة. الخروج المتكرر بيتسجل ويوصل للمدرّس.
        </div>
      )}
      <div className="card" style={{
        position: "sticky", top: 0, zIndex: 10, display: "flex",
        justifyContent: "space-between", alignItems: "center",
      }}>
        <h2 style={{ margin: 0 }}>{examTitle}</h2>
        <span className="badge" style={{
          fontSize: 18,
          background: remainingSeconds <= 60 ? "var(--danger-bg)" : "var(--success-bg)",
          color: remainingSeconds <= 60 ? "var(--danger)" : "var(--primary)",
        }}>
          ⏱ {formatTime(remainingSeconds)}
        </span>
      </div>

      {questions.map((q, i) => (
        <div className="card" key={q._id}>
          <p><strong>{i + 1}. {q.text}</strong> {q.type === "essay" && <span className="badge">سؤال مقالي</span>}</p>

          {q.type === "essay" ? (
            <textarea rows={4} placeholder="اكتب إجابتك هنا..."
              value={answers[q._id]?.essayAnswer || ""}
              onChange={(e) => setAnswers({ ...answers, [q._id]: { essayAnswer: e.target.value } })} />
          ) : (
            q.options.map((opt, idx) => (
              <label key={idx} style={{ display: "block", margin: "6px 0" }}>
                <input type="radio" name={q._id}
                  checked={answers[q._id]?.selectedOptionIndex === idx}
                  onChange={() => selectAnswer(q._id, idx)} /> {opt}
              </label>
            ))
          )}
        </div>
      ))}
      <button className="btn" onClick={handleSubmit}>تسليم الامتحان</button>
    </div>
  );
}
