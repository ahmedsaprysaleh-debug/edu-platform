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
    </div>
  );
}