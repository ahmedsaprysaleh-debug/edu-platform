import { useEffect, useState } from "react";
import api from "../api/axios";
import Spinner from "../components/Spinner";

export default function Leaderboard() {
  const [students, setStudents] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");

  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data));
  }, []);

  useEffect(() => {
    setStudents(null);
    const url = courseId ? `/exams/leaderboard/top?courseId=${courseId}` : "/exams/leaderboard/top";
    api.get(url).then((res) => setStudents(res.data));
  }, [courseId]);

  return (
    <div className="container">
      <div className="card">
        <h2>🏆 لوحة المتصدرين</h2>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">🌍 كل الكورسات (النقاط الكلية)</option>
          {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>

        {!students ? <Spinner /> : (
          students.length === 0 ? <p>لسه مفيش نتايج في القسم ده.</p> :
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
