const { Sequelize } = require("sequelize");
require("dotenv").config();

// ── Pool koneksi ──────────────────────────────────────────────────────────
// Backend ini jalan sebagai Web Service (Vercel Services / Render — proses
// long-running, BUKAN serverless per-request), jadi cukup satu pool kecil
// yang dipakai bersama sepanjang umur proses. Tidak perlu idle timeout
// agresif seperti pola serverless karena prosesnya tidak cold-start ulang.
//
// CATATAN: paket Clever Cloud "DEV" adalah shared plan dengan connection
// limit kecil. Pool tetap dibuat kecil (max 3) untuk jaga-jaga, tapi karena
// cuma ada satu proses backend yang berjalan (bukan banyak instance
// serverless), risiko "too many connections" jauh lebih rendah dibanding
// mode serverless. Kalau nanti traffic naik dan tetap kena limit, solusi
// jangka panjangnya adalah upgrade paket Clever Cloud (XS ke atas).
const poolConfig = {
  max: 3,
  min: 0,
  acquire: 30000,
  idle: 10000,
};

const createConnection = () => {
  // Production: pakai DB_URL (dari Clever Cloud/Railway/PlanetScale/dll)
  // Development: pakai host/user/pass/dbname terpisah
  return process.env.DB_URL
    ? new Sequelize(process.env.DB_URL, {
        dialect: "mysql",
        dialectOptions: {
          ssl: { require: true, rejectUnauthorized: false }
        },
        logging: false,
        pool: poolConfig,
      })
    : new Sequelize(
        process.env.DB_NAME || "spk_naive_bayes",
        process.env.DB_USER || "root",
        process.env.DB_PASS || "",
        {
          host: process.env.DB_HOST || "localhost",
          dialect: "mysql",
          logging: false,
          pool: poolConfig,
        }
      );
};

// Guard supaya tidak bikin koneksi ganda kalau module ini di-require ulang
// (misal saat hot-reload dev). Tidak wajib untuk mode Web Service produksi,
// tapi aman untuk dibiarkan.
if (!global.__sequelizeInstance) {
  global.__sequelizeInstance = createConnection();
}

module.exports = global.__sequelizeInstance;
