import { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../Toast";
import Spinner from "../components/Spinner";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const load = () => {
    Promise.all([api.get("/admin/users"), api.get("/admin/stats")])
      .then(([u, s]) => { setUsers(u.data); setStats(s.data); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const changeRole = async (id, role) => {
    await api.patch(`/admin/users/${id}/role`, { role });
    showToast("تم تغيير الصلاحية");
    load();
  };

  const toggleActive = async (id) => {
    await api.patch(`/admin/users/${id}/toggle-active`);
    load();
  };

  const removeUser = async (id) => {
    if (!confirm("متأكد إنك عايز تحذف المستخدم ده؟")) return;
    await api.delete(`/admin/users/${id}`);
    showToast("تم حذف المستخدم");
    load();
  };

  if (loading) return <div className="container"><Spinner /></div>;

  return (
    <div className="container">
      <h2>⚙️ لوحة تحكم الأدمن</h2>

      {stats && (
  <div className="stats-grid">
    <div className="stat-box">
      <strong>{stats.studentsCount}</strong>
      <p>طالب</p>
    </div>
    <div className="stat-box green">
      <strong>{stats.teachersCount}</strong>
      <p>مدرّس</p>
    </div>
    <div className="stat-box purple">
      <strong>{stats.coursesCount}</strong>
      <p>كورس</p>
    </div>
    <div className="stat-box orange">
      <strong>{stats.totalRevenue} جنيه</strong>
      <p>إجمالي الدخل</p>
    </div>
  </div>
)}

      <div className="card">
        <h3>المستخدمين</h3>
        {users.map((u) => (
          <div key={u._id} className="leaderboard-row" style={{ flexWrap: "wrap", gap: 8 }}>
            <span>{u.name} — {u.email} {!u.isActive && "🚫"}</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)} style={{ width: "auto", margin: 0 }}>
                <option value="student">طالب</option>
                <option value="teacher">مدرّس</option>
                <option value="admin">أدمن</option>
              </select>
              <button className="icon-btn" onClick={() => toggleActive(u._id)}>
                {u.isActive ? "تعطيل" : "تفعيل"}
              </button>
              <button className="icon-btn" onClick={() => removeUser(u._id)}>حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
