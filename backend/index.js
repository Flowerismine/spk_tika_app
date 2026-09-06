const express = require("express");
const dotenv = require("dotenv");
const db = require("./config/database.js");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const UserRoute = require("./routes/UserRoute.js");
const AuthRoute = require("./routes/AuthRoute.js");
const KriteriaDefisitRoute = require("./routes/KriteriaDefisitRoute.js");
const KriteriaSurplusRoute = require("./routes/KriteriaSurplusRoute.js");
const DatasetDefisitRoute = require("./routes/DatasetDefisitRoute.js");
const DatasetSurplusRoute = require("./routes/DatasetSurplusRoute.js");
const HasilAkhirPasienRoute = require("./routes/HasilAkhirPasienRoute.js");
const KriteriaMakananRoute = require("./routes/KriteriaMakananRoute.js");
const DatasetMakananRoute = require("./routes/DatasetMakananRoute.js");
const HasilAkhirMakananRoute = require("./routes/HasilAkhirMakananRoute.js");
const PerhitunganRoute = require("./routes/PerhitunganRoute.js");

dotenv.config();
const app = express();
// Vercel Services (dan platform Web Service lain seperti Render) menyuntikkan
// PORT sendiri — backend harus listen di situ, bukan port tetap.
const port = process.env.PORT || process.env.APP_PORT || 5000;

// CORS — izinkan localhost (development) dan URL production
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  credentials: true,
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(null, false);
    }
  }
}));

app.use(cookieParser());
app.use(express.json());

app.use(UserRoute);
app.use(AuthRoute);
app.use(KriteriaDefisitRoute);
app.use(KriteriaSurplusRoute);
app.use(DatasetDefisitRoute);
app.use(DatasetSurplusRoute);
app.use(HasilAkhirPasienRoute);
app.use(KriteriaMakananRoute);
app.use(DatasetMakananRoute);
app.use(HasilAkhirMakananRoute);
app.use(PerhitunganRoute);

// Guard ini mencegah authenticate()+sync() terpanggil dua kali kalau file
// ini di-require ulang (misal saat hot-reload dev). Di mode Web Service
// (Vercel Services / Render), proses cuma start sekali, jadi guard ini
// sekadar jaga-jaga, bukan requirement utama.
if (!global.__dbInitialized) {
  global.__dbInitialized = (async () => {
    try {
      await db.authenticate();
      console.log("Database connected");
      await db.sync();
      console.log("All tables synced");

      // Auto-seed user admin jika belum ada
      const Users = require("./models/UserModel.js");
      const argon = require("argon2");
      const existing = await Users.findOne({ where: { username: "admin" } });
      if (!existing) {
        const hashPassword = await argon.hash("admin123");
        await Users.create({
          username: "admin",
          email: "admin@spk.com",
          password: hashPassword,
          role: "admin",
        });
        console.log("✅ Default admin user created (admin / admin123)");
      }
    } catch (err) {
      console.error("Database error:", err.message);
    }
  })();
}

app.listen(port, () => console.log(`Server berjalan di port ${port}`));

module.exports = app;
