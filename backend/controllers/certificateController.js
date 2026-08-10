const PDFDocument = require("pdfkit");
const User = require("../models/User");
const Course = require("../models/Course");

exports.downloadCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user.certificates.some((c) => c.toString() === courseId)) {
      return res.status(403).json({ message: "لسه محصلتش على شهادة الكورس ده" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "الكورس مش موجود" });

    const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="certificate-${courseId}.pdf"`);
    doc.pipe(res);

    const { width, height } = doc.page;

    // إطار خارجي
    doc.rect(20, 20, width - 40, height - 40).lineWidth(3).stroke("#4f46e5");
    doc.rect(30, 30, width - 60, height - 60).lineWidth(1).stroke("#818cf8");

    doc.fontSize(14).fillColor("#6b7280")
      .text("EDU PLATFORM", 0, 70, { align: "center" });

    doc.fontSize(34).fillColor("#1f2430")
      .text("Certificate of Completion", 0, 110, { align: "center" });

    doc.fontSize(14).fillColor("#6b7280")
      .text("This certifies that", 0, 175, { align: "center" });

    doc.fontSize(28).fillColor("#4f46e5")
      .text(user.name, 0, 205, { align: "center" });

    doc.fontSize(14).fillColor("#6b7280")
      .text("has successfully completed the course", 0, 250, { align: "center" });

    doc.fontSize(22).fillColor("#1f2430")
      .text(course.title, 0, 280, { align: "center" });

    const dateStr = new Date().toLocaleDateString("en-GB");
    doc.fontSize(12).fillColor("#6b7280")
      .text(`Date: ${dateStr}`, 0, height - 90, { align: "center" });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
