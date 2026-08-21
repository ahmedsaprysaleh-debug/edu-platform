export default function About() {
  return (
    <div className="container">
      <div className="card">
        <h2>📖 من نحن</h2>
        <p>
          منصتي التعليمية هي منصة تعليمية شاملة تهدف لتقديم محتوى تعليمي عالي الجودة
          لكل مراحل الدراسة، من خلال نخبة من أفضل المدرسين في مختلف المواد.
        </p>
        <p>
          بنوفر كورسات فيديو، امتحانات إلكترونية، نظام متابعة تقدم، ونظام تنافسي
          بين الطلاب لتحفيزهم على التعلم المستمر.
        </p>
      </div>

      <div className="card">
        <h2>📞 تواصل معنا</h2>
        <p>لو عندك أي استفسار أو مشكلة، تقدر تتواصل معانا من خلال:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          <a href="https://wa.me/+201027218581" target="_blank" rel="noreferrer" className="btn secondary" style={{ textDecoration: "none", textAlign: "center" }}>
            💬 واتساب: 01027218581
          </a>
          <a href="mailto:info@example.com" className="btn secondary" style={{ textDecoration: "none", textAlign: "center" }}>
            📧 info@example.com
          </a>
        </div>
      </div>

      <div className="card" style={{ textAlign: "center" }}>
        <h2>📱 افتح الموقع من موبايلك</h2>
        <p>صوّر الكود ده بكاميرا موبايلك عشان تفتح الموقع بسرعة</p>
        <img
          src="/site-qrcode.png"
          alt="QR code لموقع منصتي التعليمية"
          style={{ width: 180, height: 180, margin: "12px auto", borderRadius: 12, background: "#fff", padding: 10 }}
        />
      </div>
    </div>
  );
}