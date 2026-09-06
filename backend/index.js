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
const port = process.env.PORT || process.env.APP_PORT || 5000;

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  credentials: true,
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production" || origin.includes("netlify.app") || origin.includes("vercel.app")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  }
}));

app.use(cookieParser());
app.use(express.json());

// Mount all routes for both root AND /api prefix for Netlify / Vercel Serverless Function compatibility
const routes = [
  UserRoute,
  AuthRoute,
  KriteriaDefisitRoute,
  KriteriaSurplusRoute,
  DatasetDefisitRoute,
  DatasetSurplusRoute,
  HasilAkhirPasienRoute,
  KriteriaMakananRoute,
  DatasetMakananRoute,
  HasilAkhirMakananRoute,
  PerhitunganRoute,
];

routes.forEach((route) => {
  app.use(route);
  app.use("/api", route);
});

if (!global.__dbInitialized) {
  global.__dbInitialized = (async () => {
    try {
      await db.authenticate();
      console.log("Database connected");
      await db.sync();
      console.log("All tables synced");

      // Auto-seed user admin jika belum ada
      const Users = require("./models/UserModel.js");
      const { hashPassword } = require("./utils/passwordHelper.js");
      const existing = await Users.findOne({ where: { username: "admin" } });
      if (!existing) {
        const hashedPassword = await hashPassword("admin123");
        await Users.create({
          username: "admin",
          email: "admin@spk.com",
          password: hashedPassword,
          role: "admin",
        });
        console.log("✅ Default admin user created (admin / admin123)");
      }
    } catch (err) {
      console.error("Database error:", err.message);
    }
  })();
}

if (require.main === module) {
  app.listen(port, () => console.log(`Server berjalan di port ${port}`));
}

module.exports = app;
