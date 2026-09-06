const { Sequelize } = require("sequelize");
require("dotenv").config();

// ── Connection caching untuk lingkungan serverless (Vercel) ─────────────────
// Setiap cold start bisa membuat koneksi baru ke MySQL. Tanpa cache, koneksi
// akan menumpuk dan cepat menghabiskan connection limit MySQL (apalagi di
// provider gratis). global object bertahan antar invocation selama container
// masih "hangat", jadi kita simpan instance Sequelize di situ.
//
// CATATAN: paket Clever Cloud "DEV" adalah shared plan dengan connection
// limit sangat kecil. Karena Vercel bisa menjalankan beberapa function
// instance bersamaan (tiap instance = koneksi terpisah ke MySQL), pool di
// sini sengaja dibuat sekecil mungkin (1 koneksi per instance) dan idle
// timeout dipercepat supaya koneksi cepat dilepas saat tidak dipakai.
// Kalau traffic naik dan sering kena error "too many connections", solusi
// jangka panjangnya adalah upgrade paket Clever Cloud (XS ke atas), bukan
// menaikkan angka di sini.
const poolConfig = {
  max: 1,      // 1 koneksi per function instance — paling aman untuk plan DEV
  min: 0,
  acquire: 30000,
  idle: 1000,  // lepas koneksi cepat setelah idle, jangan digantung lama
  evict: 1000,
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

if (!global.__sequelizeInstance) {
  global.__sequelizeInstance = createConnection();
}

module.exports = global.__sequelizeInstance;
