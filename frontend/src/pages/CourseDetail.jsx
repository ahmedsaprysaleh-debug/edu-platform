import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import { useToast } from "../Toast";

function toEmbedUrl(url) {
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1].split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes("youtube.com/watch")) {
    const id = new URL(url).searchParams.get("v");
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes("vimeo.com/")) {
    const id = url.split("vimeo.com/")[1].split(/[?&]/)[0];
    return `https://player.vimeo.com/video/${id}`;
  }
  return url;
}

function ProtectedVideo({ video, onWatched }) {
  const [streamUrl, setStreamUrl] = useState(null);
  const marked = useState(false)[0]; // مش محتاجين setter هنا

  useEffect(() => {
    api.post(`/videos/${video._id}/token`).then((res) => {
      const url = res.data.streamUrl;
      setStreamUrl(url.startsWith("http") ? url : `${api.defaults.baseURL.replace("/api", "")}${url}`);
    });
  }, [video._id]);

  const handlePlay = () => {
    if (!video.watched) onWatched(video._id);
  };

  const isEmbed = streamUrl && (streamUrl.includes("youtu") || streamUrl.includes("vimeo"));

  return (
    <div className="card">
      <h4>{video.title} {video.watched && <span style={{ color: "#16a34a" }}>✅ اتفرجت عليه</span>}</h4>
      {streamUrl ? (
        isEmbed ? (
          <iframe
            src={toEmbedUrl(streamUrl)}
            allow="autoplay; fullscreen"
            allowFullScreen
            onLoad={handlePlay}
            style={{ width: "100%", aspectRatio: "16/9", border: 0, borderRadius: 8 }}
          />
        ) : (
          <video
            src={streamUrl}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            onPlay={handlePlay}
            style={{ width: "100%", borderRadius: 8 }}
          />
        )
      ) : <Spinner />}
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [locked, setLocked] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const { showToast } = useToast();

  const loadVideos = () => {
    api.get(`/courses/${id}/videos`)
      .then((res) => setVideos(res.data))
      .catch((err) => {
        if (err.response?.status === 403) setLocked(true);
      });
  };

  useEffect(() => {
    api.get(`/courses/${id}`).then((res) => setCourse(res.data));
    loadVideos();
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      showToast("تم الاشتراك في الكورس ✅");
      setEnrolled(true);
    } catch (err) {
      showToast(err.response?.data?.message || "حصل خطأ", "error");
    } finally {
      setEnrolling(false);
    }
  };

  const handleWatched = async (videoId) => {
    try {
      await api.post(`/videos/${videoId}/watched`);
      setVideos((prev) => prev.map((v) => (v._id === videoId ? { ...v, watched: true } : v)));
    } catch {}
  };

  if (!course) return <div className="container"><Spinner /></div>;

  const watchedCount = videos.filter((v) => v.watched).length;
  const progressPercent = videos.length > 0 ? Math.round((watchedCount / videos.length) * 100) : 0;

  return (
    <div className="container">
      <div className="card">
        <h2>{course.title}</h2>
        <p>{course.description}</p>
        <p>{course.isFree ? "مجاني" : `${course.price} جنيه`}</p>

        {course.isFree && !enrolled && (
          <button className="btn" onClick={handleEnroll} disabled={enrolling}>
            {enrolling ? "جاري الاشتراك..." : "اشترك في الكورس"}
          </button>
        )}
        {enrolled && <p style={{ color: "#16a34a" }}>✅ انت مشترك في الكورس ده</p>}

        {locked && (
          <>
            <p style={{ color: "var(--danger)" }}>🔒 لازم تدفع تمن الكورس عشان تشوف الفيديوهات</p>
            <Link className="btn" to={`/payment/${course._id}`}>ادفع دلوقتي</Link>
          </>
        )}

        {videos.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p className="muted">تقدمك: {watchedCount} من {videos.length} فيديو ({progressPercent}%)</p>
            <div style={{ background: "var(--border)", borderRadius: 20, height: 10, overflow: "hidden" }}>
              <div style={{
                width: `${progressPercent}%`, height: "100%",
                background: "linear-gradient(135deg,#22c55e,#16a34a)", transition: "width .3s ease"
              }} />
            </div>
          </div>
        )}
      </div>

      {videos.map((v) => <ProtectedVideo key={v._id} video={v} onWatched={handleWatched} />)}
    </div>
  );
}