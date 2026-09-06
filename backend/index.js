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
const port = process.env.APP_PORT || 5000;

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

// Di lingkungan serverless (Vercel), module ini bisa di-require ulang tiap
// cold start. Kita pakai flag di `global` supaya authenticate()+sync() cuma
// jalan sekali per container yang masih hangat, bukan tiap invocation.
if (!global.__dbInitialized) {
  global.__dbInitialized = (async () => {
    try {
      await db.authenticate();
      console.log("Database connected");
      await db.sync();
      console.log("All tables synced");
    } catch (err) {
      console.error("Database error:", err.message);
    }
  })();
}

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => console.log(`Server berjalan secara lokal di port ${port}`));
}

module.exports = app;
