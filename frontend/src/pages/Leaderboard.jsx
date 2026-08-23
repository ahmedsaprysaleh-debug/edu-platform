import { useEffect, useState } from "react";
import api from "../api/axios";
import Spinner from "../components/Spinner";

export default function Leaderboard() {
  const [students, setStudents] = useState(null);

  useEffect(() => {
    api.get("/exams/leaderboard/top").then((res) => setStudents(res.data));
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>🏆 لوحة المتصدرين</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: -4 }}>
          الترتيب بناءً على إجمالي النقاط من كل الامتحانات التنافسية
        </p>

        {!students ? <Spinner /> : (
          students.length === 0 ? <p>لسه مفيش نتايج.</p> :
          students.map((s, i) => (
            <div className="leaderboard-row" key={s._id}>
              <span>{i + 1}. {s.name}</span>
              <span className="badge">{s.points} نقطة</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}