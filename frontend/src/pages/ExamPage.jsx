import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function ExamPage() {
  const { examId } = useParams();
  const storageKey = `exam-answers-${examId}`;

  const [examTitle, setExamTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [error, setError] = useState("");
  const [tabWarning, setTabWarning] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = useCallback(async ({ skipConfirm = false } = {}) => {
    if (submittingRef.current) return;

    if (!skipConfirm) {
      const answeredCount = Object.keys(answers).length;
      const confirmMsg =
        answeredCount < questions.length
          ? `لسه فاضل ${questions.length - answeredCount} سؤال من غير إجابة. متأكد إنك عايز تسلّم الامتحان؟`
          : "متأكد إنك عايز تسلّم الامتحان؟ مش هتقدر تعدّل بعد كده.";
      if (!window.confirm(confirmMsg)) return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
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
      localStorage.removeItem(storageKey);
    } catch (err) {
      setError(err.response?.data?.message || "حصل خطأ في التسليم");
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [answers, examId, questions.length, storageKey]);

  // بدء الامتحان: الأسئلة والاختيارات بترجع من السيرفر جاهزة ومخلوطة خصيصًا لهذا الطالب
  useEffect(() => {
    api.post(`/exams/${examId}/start`).then(({ data }) => {
      setExamTitle(data.examTitle || "");
      setQuestions(data.questions);
      const startedAt = new Date(data.startedAt).getTime();
      const totalAllowed = data.durationMinutes * 60;
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemainingSeconds(Math.max(totalAllowed - elapsed, 0));

      // استرجاع أي إجابات محفوظة محليًا من قبل (لو الطالب عمل refresh بالغلط)
      try {
        const saved = localStorage.getItem(`exam-answers-${examId}`);
        if (saved) setAnswers(JSON.parse(saved));
      } catch {
        // تجاهل أي خطأ في القراءة من localStorage
      }
    }).catch((err) => setError(err.response?.data?.message || "حصل خطأ"));
  }, [examId]);

  // حفظ الإجابات أول بأول في localStorage عشان لو حصل refresh أو قفل تاب بالغلط
  // ما يضيعش إجابات الطالب. ده حل مؤقت في الفرونت فقط - لسه محتاجين endpoint
  // في الباك اند لحفظ الإجابات على السيرفر لحماية أقوى (لو الجهاز نفسه اتقفل مثلاً).
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch {
      // تجاهل أي خطأ في الكتابة (مساحة ممتلئة مثلاً)
    }
  }, [answers, storageKey]);

  // التايمر
  useEffect(() => {
    if (remainingSeconds === null || result) return;
    if (remainingSeconds <= 0) { handleSubmit({ skipConfirm: true }); return; }
    const timer = setTimeout(() => setRemainingSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [remainingSeconds, result, handleSubmit]);

  // تحذير لو الطالب حاول يقفل التاب أو يعمل refresh وهو لسه ماسلمش
  useEffect(() => {
    if (result) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [result]);

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

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="container">
      {tabWarning > 0 && (
        <div className="card" style={{ background: "var(--danger-bg)", color: "var(--danger)", fontSize: 14 }}>
          ⚠️ تم رصد خروجك من صفحة الامتحان {tabWarning} مرة. الخروج المتكرر بيتسجل ويوصل للمدرّس.
        </div>
      )}
      <div className="card" style={{
        position: "sticky", top: 0, zIndex: 10, display: "flex",
        justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
      }}>
        <h2 style={{ margin: 0 }}>{examTitle}</h2>
        <span className="badge" style={{ fontSize: 14 }}>
          {answeredCount} / {questions.length} سؤال اتجاوب
        </span>
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
      <button className="btn" onClick={() => handleSubmit()} disabled={isSubmitting}>
        {isSubmitting ? "جاري التسليم..." : "تسليم الامتحان"}
      </button>
    </div>
  );
}