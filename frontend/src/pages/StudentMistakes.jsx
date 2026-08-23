import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function StudentMistakes() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [mistakes, setMistakes] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/exams/mistakes/student/${studentId}`)
      .then(({ data }) => {
        setStudent(data.student);
        setMistakes(data.mistakes);
      })
      .catch((err) => setError(err.response?.data?.message || "حصل خطأ"));
  }, [studentId]);

  if (error) {
    return <div className="container"><div className="card" style={{ color: "var(--danger)" }}>{error}</div></div>;
  }

  if (mistakes === null) return <div className="container">جاري التحميل...</div>;

  // نجمّع الأسئلة حسب الكورس ثم الامتحان
  const byCourse = mistakes.reduce((acc, m) => {
    const courseKey = m.courseTitle || "بدون كورس";
    acc[courseKey] = acc[courseKey] || {};
    acc[courseKey][m.examTitle] = acc[courseKey][m.examTitle] || [];
    acc[courseKey][m.examTitle].push(m);
    return acc;
  }, {});

  return (
    <div className="container">
      <div className="card">
        <h2>الأسئلة الغلط - {student?.name}</h2>
        <p className="muted">{student?.email}</p>
        <p className="muted">
          {mistakes.length === 0
            ? "الطالب ده مغلطش في أي سؤال لحد دلوقتي 🎉"
            : `${mistakes.length} سؤال غلط فيه، مجمّعين حسب الكورس والامتحان.`}
        </p>
      </div>

      {Object.entries(byCourse).map(([courseTitle, exams]) => (
        <div key={courseTitle} className="card">
          <h3>{courseTitle}</h3>
          {Object.entries(exams).map(([examTitle, items]) => (
            <div key={examTitle} style={{ marginTop: 12 }}>
              <p className="badge">{examTitle}</p>
              {items.map((m) => (
                <div key={m.questionId} style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                  <p><strong>{m.questionText}</strong></p>
                  <p style={{ color: "var(--danger)" }}>إجابة الطالب: {m.studentAnswer ?? "(من غير إجابة)"}</p>
                  <p style={{ color: "var(--primary)" }}>الإجابة الصح: {m.correctAnswer}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
