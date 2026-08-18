const mongoose = require("mongoose");

// كاش الاتصال بين استدعاءات الـ serverless function المختلفة
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  // لو فيه اتصال شغال بالفعل، استخدمه على طول
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000, // 10 ثواني بدل الافتراضي (30s) عشان الـ function متعلقش كتير
        socketTimeoutMS: 45000,
        maxPoolSize: 10, // مناسب لـ M0 free tier
        bufferCommands: false,
      })
      .then((m) => {
        console.log("✅ MongoDB connected");
        return m;
      })
      .catch((err) => {
        cached.promise = null; // امسح الـ promise عشان المحاولة الجاية تعيد المحاولة
        console.error("❌ MongoDB connection error:", err.message);
        throw err; // نرمي الخطأ بدل ما نعمل process.exit
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
