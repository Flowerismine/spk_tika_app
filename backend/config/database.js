const { Sequelize } = require("sequelize");
require("dotenv").config();

// Production: pakai DB_URL (dari Render/Railway/Supabase)
// Development: pakai host/user/pass/dbname terpisah
const db = process.env.DB_URL
  ? new Sequelize(process.env.DB_URL, {
      dialect: "mysql",
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
      },
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME || "spk_naive_bayes",
      process.env.DB_USER || "root",
      process.env.DB_PASS || "",
      {
        host: process.env.DB_HOST || "localhost",
        dialect: "mysql",
        logging: false,
      }
    );

module.exports = db;
