import { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../Toast";
import Spinner from "../components/Spinner";
import { useAuth } from "../App";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const load = () => {
    Promise.all([api.get("/admin/users"), api.get("/admin/stats")])
      .then(([u, s]) => { setUsers(u.data); setStats(s.data); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      showToast("تم تغيير الصلاحية");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ في تغيير الصلاحية", "error");
      load(); // نرجّع القيم الصح من السيرفر لو الـ dropdown اتغيّر بصريًا من غير ما ينفّذ فعليًا
    }
  };

  const toggleActive = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/toggle-active`);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ", "error");
    }
  };

  const removeUser = async (id) => {
    if (!confirm("متأكد إنك عايز تحذف المستخدم ده؟")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      showToast("تم حذف المستخدم");
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ في حذف المستخدم", "error");
    }
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
        {users.map((u) => {
          const isSelf = currentUser && u._id === currentUser.id;
          return (
            <div key={u._id} className="leaderboard-row" style={{ flexWrap: "wrap", gap: 8 }}>
              <span>
                {u.name} — {u.email} {!u.isActive && "🚫"}
                {isSelf && <span className="badge" style={{ marginRight: 6 }}>(انت)</span>}
              </span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {isSelf ? (
                  <span className="muted" style={{ fontSize: 13 }}>متقدرش تعدّل حسابك انت نفسك</span>
                ) : (
                  <>
                    <select value={u.role} onChange={(e) => changeRole(u._id, e.target.value)} style={{ width: "auto", margin: 0 }}>
                      <option value="student">طالب</option>
                      <option value="teacher">مدرّس</option>
                      <option value="admin">أدمن</option>
                    </select>
                    <button className="icon-btn" onClick={() => toggleActive(u._id)}>
                      {u.isActive ? "تعطيل" : "تفعيل"}
                    </button>
                    <button className="icon-btn" onClick={() => removeUser(u._id)}>حذف</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}