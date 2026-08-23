import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Spinner from "../components/Spinner";

const CATEGORIES = ["رياضيات", "علوم", "لغات", "حاسب آلي", "تاريخ وجغرافيا", "أخرى"];

export default function Courses() {
  const [courses, setCourses] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    setCourses(null);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const t = setTimeout(() => {
      api.get(`/courses?${params.toString()}`).then((res) => setCourses(res.data));
    }, 300);
    return () => clearTimeout(t);
  }, [search, category]);

  const imgBase = api.defaults.baseURL.replace("/api", "");

  return (
    <div className="container">
      <div className="hero-filter">
        <h2>مرحلتك ودراستك:</h2>
        <select className="dropdown-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">كل التصنيفات</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="dropdown-select" placeholder="🔍 دوّر على كورس..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      {!courses ? <Spinner /> : (
        <>
          {courses.length === 0 && <p>مفيش كورسات مطابقة للبحث.</p>}
          {courses.map((c) => (
            <div className="circle-card" key={c._id}>
{c.coverImageFilename ? (
<img
  src={c.coverImageFilename}
  alt={c.title}
  style={{
    width: "100%",
    height: 180,
    objectFit: "cover",
    display: "block",
  }}
/>) : (
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
              <p className="muted">{c.description}</p>
              <p className="muted">👨‍🏫 {c.teacher?.name}</p>
              <p>{c.isFree ? "مجاني" : `${c.price} جنيه`}</p>
              <Link className="btn" to={`/courses/${c._id}`} style={{ margin: "0 12px 12px" }}>عرض الكورس</Link>
            </div>
          ))}
        </>
      )}
    </div>
  );
}