const db = require("./config/database.js");
const Users = require("./models/UserModel.js");
const KriteriaDefisit = require("./models/KriteriaDefisitModel.js");
const KriteriaSurplus = require("./models/KriteriaSurplusModel.js");
const KriteriaMakanan = require("./models/KriteriaMakananModel.js");
const DatasetDefisit = require("./models/DatasetDefisitModel.js");
const DatasetSurplus = require("./models/DatasetSurplusModel.js");
const DatasetMakanan = require("./models/DatasetMakananModel.js");
const HasilAkhirPasien = require("./models/HasilAkhirPasienModel.js");
const HasilAkhirMakanan = require("./models/HasilAkhirMakananModel.js");
const { hashPassword } = require("./utils/passwordHelper.js");

const KRITERIA_DEFISIT = ["Jenis Kelamin", "Aktivitas", "IMT", "Usia", "Tingkat Stres", "Main"];
const KRITERIA_SURPLUS = ["Jenis Kelamin", "Aktivitas", "IMT", "Usia", "Tingkat Stres", "Main"];
const KRITERIA_MAKANAN = ["Nama Makanan", "Kategori Makanan", "Kalori Tinggi", "Karbo Tinggi", "Protein Tinggi", "Lemak Tinggi", "IG Tinggi", "Kategori"];

const DATASET_DEFISIT = [
  { "Jenis Kelamin": "Pria",   "Aktivitas": "Ringan", "IMT": "Kurang",      "Usia": "Lansia Awal", "Tingkat Stres": "Rendah", "Main": "Tidak" },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Ringan", "IMT": "Berlebih",    "Usia": "Lansia Awal", "Tingkat Stres": "Tinggi", "Main": "Ya"    },
  { "Jenis Kelamin": "Pria",   "Aktivitas": "Berat",  "IMT": "Berlebih",    "Usia": "Lansia Awal", "Tingkat Stres": "Tinggi", "Main": "Ya"    },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Ringan", "IMT": "Normal",      "Usia": "Lansia Awal", "Tingkat Stres": "Sedang", "Main": "Tidak" },
  { "Jenis Kelamin": "Pria",   "Aktivitas": "Ringan", "IMT": "Berlebih",    "Usia": "Lansia Awal", "Tingkat Stres": "Sedang", "Main": "Ya"    },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Sedang", "IMT": "Kurang",      "Usia": "Dewasa",      "Tingkat Stres": "Rendah", "Main": "Tidak" },
  { "Jenis Kelamin": "Pria",   "Aktivitas": "Sedang", "IMT": "Normal",      "Usia": "Lansia Awal", "Tingkat Stres": "Sedang", "Main": "Tidak" },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Berat",  "IMT": "Berlebih",    "Usia": "Dewasa",      "Tingkat Stres": "Tinggi", "Main": "Ya"    },
  { "Jenis Kelamin": "Pria",   "Aktivitas": "Berat",  "IMT": "Normal",      "Usia": "Lansia Awal", "Tingkat Stres": "Sedang", "Main": "Tidak" },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Sedang", "IMT": "Berlebih",    "Usia": "Lansia Awal", "Tingkat Stres": "Tinggi", "Main": "Ya"    },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Ringan", "IMT": "Berlebih",    "Usia": "Lansia Awal", "Tingkat Stres": "Tinggi", "Main": "Ya"    },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Berat",  "IMT": "Underweight", "Usia": "Dewasa",      "Tingkat Stres": "Sedang", "Main": "Tidak" },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Sedang", "IMT": "Overweight",  "Usia": "Lansia Awal", "Tingkat Stres": "Tinggi", "Main": "Ya"    },
];

const DATASET_SURPLUS = [
  { "Jenis Kelamin": "Pria",   "Aktivitas": "Ringan", "IMT": "Kurang",      "Usia": "Lansia Awal", "Tingkat Stres": "Rendah", "Main": "Ya"    },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Ringan", "IMT": "Berlebih",    "Usia": "Lansia Awal", "Tingkat Stres": "Tinggi", "Main": "Tidak" },
  { "Jenis Kelamin": "Pria",   "Aktivitas": "Berat",  "IMT": "Berlebih",    "Usia": "Lansia Awal", "Tingkat Stres": "Tinggi", "Main": "Tidak" },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Ringan", "IMT": "Normal",      "Usia": "Lansia Awal", "Tingkat Stres": "Sedang", "Main": "Tidak" },
  { "Jenis Kelamin": "Pria",   "Aktivitas": "Ringan", "IMT": "Berlebih",    "Usia": "Lansia Awal", "Tingkat Stres": "Sedang", "Main": "Tidak" },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Sedang", "IMT": "Kurang",      "Usia": "Dewasa",      "Tingkat Stres": "Rendah", "Main": "Ya"    },
  { "Jenis Kelamin": "Pria",   "Aktivitas": "Sedang", "IMT": "Normal",      "Usia": "Lansia Awal", "Tingkat Stres": "Sedang", "Main": "Tidak" },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Berat",  "IMT": "Berlebih",    "Usia": "Dewasa",      "Tingkat Stres": "Tinggi", "Main": "Tidak" },
  { "Jenis Kelamin": "Pria",   "Aktivitas": "Berat",  "IMT": "Normal",      "Usia": "Lansia Awal", "Tingkat Stres": "Sedang", "Main": "Tidak" },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Sedang", "IMT": "Berlebih",    "Usia": "Lansia Awal", "Tingkat Stres": "Tinggi", "Main": "Tidak" },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Ringan", "IMT": "Berlebih",    "Usia": "Lansia Awal", "Tingkat Stres": "Tinggi", "Main": "Tidak" },
  { "Jenis Kelamin": "Wanita", "Aktivitas": "Berat",  "IMT": "Underweight", "Usia": "Dewasa",      "Tingkat Stres": "Sedang", "Main": "Ya"    },
  { "Jenis Kelamin": "Pria",   "Aktivitas": "Ringan", "IMT": "Underweight", "Usia": "Lansia Awal", "Tingkat Stres": "Rendah", "Main": "Ya"    },
];

const DATASET_MAKANAN = [
  { "Nama Makanan": "Nasi Merah",       "Kategori Makanan": "Karbohidrat", "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Nasi Putih",       "Kategori Makanan": "Karbohidrat", "Kalori Tinggi": "Ya",    "Karbo Tinggi": "Ya",    "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
  { "Nama Makanan": "Kentang Rebus",    "Kategori Makanan": "Karbohidrat", "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Ya",    "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
  { "Nama Makanan": "Ubi Jalar",        "Kategori Makanan": "Karbohidrat", "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Oatmeal",          "Kategori Makanan": "Karbohidrat", "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Ayam Kukus",       "Kategori Makanan": "Protein",     "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Ikan Panggang",    "Kategori Makanan": "Protein",     "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Tahu Rebus",       "Kategori Makanan": "Protein",     "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Tempe Bacem",      "Kategori Makanan": "Protein",     "Kalori Tinggi": "Ya",    "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Ya",    "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
  { "Nama Makanan": "Daging Sapi Goreng","Kategori Makanan": "Protein",    "Kalori Tinggi": "Ya",    "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Ya",    "IG Tinggi": "Tidak", "Kategori": "Tidak Boleh" },
  { "Nama Makanan": "Brokoli Rebus",    "Kategori Makanan": "Serat",       "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Bayam Rebus",      "Kategori Makanan": "Serat",       "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Wortel Kukus",     "Kategori Makanan": "Serat",       "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Apel",             "Kategori Makanan": "Buah",        "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Pisang",           "Kategori Makanan": "Buah",        "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Ya",    "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
  { "Nama Makanan": "Jeruk",            "Kategori Makanan": "Buah",        "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Semangka",         "Kategori Makanan": "Buah",        "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
  { "Nama Makanan": "Kacang Almond",    "Kategori Makanan": "Cemilan",     "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Yoghurt Plain",    "Kategori Makanan": "Cemilan",     "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Donat",            "Kategori Makanan": "Cemilan",     "Kalori Tinggi": "Ya",    "Karbo Tinggi": "Ya",    "Protein Tinggi": "Tidak", "Lemak Tinggi": "Ya",    "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
  { "Nama Makanan": "Kerupuk",          "Kategori Makanan": "Cemilan",     "Kalori Tinggi": "Ya",    "Karbo Tinggi": "Ya",    "Protein Tinggi": "Tidak", "Lemak Tinggi": "Ya",    "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
];

async function seedWithSequelize() {
  try {
    await db.authenticate();
    await db.sync({ alter: true });
    console.log("Database connected & synced tables.");

    let admin = await Users.findOne({ where: { username: "admin" } });
    if (!admin) {
      const pass = await hashPassword("admin123");
      admin = await Users.create({
        username: "admin",
        email: "admin@spk.com",
        password: pass,
        role: "admin",
      });
      console.log("Admin user created.");
    }

    const userId = admin.id;

    // Clear old datasets & criteria
    await DatasetDefisit.destroy({ where: {} });
    await DatasetSurplus.destroy({ where: {} });
    await DatasetMakanan.destroy({ where: {} });
    await KriteriaDefisit.destroy({ where: {} });
    await KriteriaSurplus.destroy({ where: {} });
    await KriteriaMakanan.destroy({ where: {} });
    await HasilAkhirPasien.destroy({ where: {} });
    console.log("Cleared old data.");

    // Seed Kriteria
    for (const name of KRITERIA_DEFISIT) {
      await KriteriaDefisit.create({ namaKriteria: name, userId });
    }
    for (const name of KRITERIA_SURPLUS) {
      await KriteriaSurplus.create({ namaKriteria: name, userId });
    }
    for (const name of KRITERIA_MAKANAN) {
      await KriteriaMakanan.create({ namaKriteria: name, userId });
    }
    console.log("✓ 18 Criteria created.");

    // Seed Datasets
    for (const item of DATASET_DEFISIT) {
      await DatasetDefisit.create({ nilai: item, userId });
    }
    for (const item of DATASET_SURPLUS) {
      await DatasetSurplus.create({ nilai: item, userId });
    }
    for (const item of DATASET_MAKANAN) {
      await DatasetMakanan.create({ nilai: item, userId });
    }
    console.log("✓ 47 Dataset items created.");

    // Seed Sample Patient Results
    const patientSamples = [
      {
        namaPasien: "Bpk. Slamat Rianto",
        kategori: "Normal",
        tipe: "pasien",
        metadata: {
          jenisKelamin: "Pria",
          beratBadan: 68,
          tinggiBadan: 165,
          usia: 52,
          faktorAktivitas: 1.3,
          faktorStres: 1.3,
          imt: 24.98,
          kategoriIMT: "Normal",
          bbr: 104.6,
          kategoriBBR: "Normal",
          bbe: 1462.5,
          kategoriBBE: "Sedang",
          hasilDefisit: "Defisit Kalori Tidak Diperlukan",
          hasilSurplus: "Surplus Kalori Tidak Diperlukan",
          rekomendasiGizi: "Diet DM II 1500 kcal / hari (Karbo 60%, Protein 15%, Lemak 25%)"
        },
        userId
      },
      {
        namaPasien: "Ibu Yunita",
        kategori: "Defisit Kalori Diperlukan (-500 kcal)",
        tipe: "pasien",
        metadata: {
          jenisKelamin: "Wanita",
          beratBadan: 74,
          tinggiBadan: 155,
          usia: 48,
          faktorAktivitas: 1.2,
          faktorStres: 1.5,
          imt: 30.8,
          kategoriIMT: "Berlebih",
          bbr: 149.5,
          kategoriBBR: "Gemuk",
          bbe: 1215.0,
          kategoriBBE: "Defisit",
          hasilDefisit: "Defisit Kalori Diperlukan (-500 kcal)",
          hasilSurplus: "Surplus Kalori Tidak Diperlukan",
          rekomendasiGizi: "Diet DM III 1300 kcal / hari (Rendah Karbo Sederhana, Tinggi Serat)"
        },
        userId
      },
      {
        namaPasien: "Bpk. Ardi Kurniawan",
        kategori: "Surplus Kalori Diperlukan (+300 kcal)",
        tipe: "pasien",
        metadata: {
          jenisKelamin: "Pria",
          beratBadan: 50,
          tinggiBadan: 170,
          usia: 38,
          faktorAktivitas: 1.5,
          faktorStres: 1.2,
          imt: 17.3,
          kategoriIMT: "Kurang",
          bbr: 76.9,
          kategoriBBR: "Kurus",
          bbe: 1620.0,
          kategoriBBE: "Surplus",
          hasilDefisit: "Defisit Kalori Tidak Diperlukan",
          hasilSurplus: "Surplus Kalori Diperlukan (+300 kcal)",
          rekomendasiGizi: "Diet DM I 1900 kcal / hari (Tinggi Protein, Kompleks Karbohidrat)"
        },
        userId
      }
    ];

    for (const sample of patientSamples) {
      await HasilAkhirPasien.create(sample);
    }
    console.log("✓ 3 Sample Patient Records created.");

    console.log("🎉 ALL REALISTIC DATASETS SEEDED PERFECTLY!");
    process.exit(0);
  } catch (err) {
    console.error("Sequelize Seed Error:", err);
    process.exit(1);
  }
}

seedWithSequelize();
