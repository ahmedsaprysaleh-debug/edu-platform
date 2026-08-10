import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Spinner from "../components/Spinner";

export default function MyCourses() {
  const [courses, setCourses] = useState(null);
  const imgBase = api.defaults.baseURL.replace("/api", "");

  useEffect(() => {
    api.get("/courses/my").then((res) => setCourses(res.data));
  }, []);

  return (
    <div className="container">
      <h2>📚 كورساتي</h2>

      {!courses ? <Spinner /> : (
        <>
          {courses.length === 0 && <p>لسه ماشتركتش في أي كورس.</p>}
          {courses.map((c) => (
            <div className="circle-card" key={c._id}>
              {c.coverImageFilename ? (
                <img src={`${imgBase}/uploads/images/${c.coverImageFilename}`} alt={c.title} />
              ) : (
                <div style={{
                  width: "100%", height: 180, background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 20, fontWeight: "bold", padding: 10, textAlign: "center"
                }}>
                  {c.title}
                </div>
              )}
              <div className="row" style={{ display: "flex", justifyContent: "space-between", padding: "0 12px" }}>
                <h3>{c.title}</h3>
                <span className="badge">{c.category}</span>
              </div>
              <p className="muted">👨‍🏫 {c.teacher?.name}</p>
              <Link className="btn" to={`/courses/${c._id}`} style={{ margin: "0 12px 12px" }}>عرض الكورس</Link>
            </div>
          ))}
        </>
      )}
    </div>
  );
}