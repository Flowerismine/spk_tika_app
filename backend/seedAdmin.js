// Script untuk membuat user admin pertama
// Cara jalankan: node seedAdmin.js
const argon = require("argon2");
const db = require("./config/database.js");
const Users = require("./models/UserModel.js");

(async () => {
  try {
    await db.authenticate();
    console.log("Database connected");
    
    // Buat tabel kalau belum ada
    await db.sync();
    
    // Cek apakah admin sudah ada
    const existing = await Users.findOne({ where: { username: "admin" } });
    if (existing) {
      console.log("⚠️  User 'admin' sudah ada");
      console.log("Username: admin");
      console.log("Password: (pakai password yang sudah ada)");
      process.exit(0);
    }
    
    const hashPassword = await argon.hash("admin123");
    await Users.create({
      username: "admin",
      email: "admin@spk.com",
      password: hashPassword,
      role: "admin",
    });
    
    console.log("✅ Admin berhasil dibuat!");
    console.log("---");
    console.log("Username : admin");
    console.log("Password : admin123");
    console.log("---");
    process.exit(0);
  } catch (e) {
    console.error("❌ Error:", e.message);
    process.exit(1);
  }
})();
