import API_URL from "../api";
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaDatabase, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaTrash, FaSeedling } from "react-icons/fa";

// ─────────────────────────────────────────────────────────────────────────────
// DATA SEED — Kriteria & Dataset lengkap dengan Usia dan Tingkat Stres
// Sumber: Tabel 4.3 & 4.6 skripsi + estimasi dari data observasi BAB IV
//         dan pedoman PERKENI (2021) yang dikutip di BAB II
// ─────────────────────────────────────────────────────────────────────────────

const KRITERIA_DEFISIT = [
  "Jenis Kelamin", "Aktivitas", "IMT", "Usia", "Tingkat Stres", "Main"
];

const KRITERIA_SURPLUS = [
  "Jenis Kelamin", "Aktivitas", "IMT", "Usia", "Tingkat Stres", "Main"
];

// Dataset Defisit — Tabel 4.3 skripsi + Usia & Tingkat Stres
// Usia: Dewasa (30–45 th) | Lansia Awal (46–59 th) | Lansia (≥60 th)
// Stres: Rendah (DM stabil) | Sedang (fluktuatif) | Tinggi (komplikasi aktif)
// Referensi estimasi: data observasi BAB IV (Slamat Rianto, Yunita, Ardi, dll.)
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

// Dataset Surplus — Tabel 4.6 skripsi + Usia & Tingkat Stres
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

// ─────────────────────────────────────────────────────────────────────────────
// DATA SEED MAKANAN — Sumber: Tabel Komposisi Zat Gizi Pangan Indonesia (TKPI)
// Kriteria: Nama, Kategori, Kalori Tinggi, Karbo Tinggi, Protein Tinggi,
//           Lemak Tinggi, IG Tinggi, Kategori (Boleh/Tidak Boleh)
// ─────────────────────────────────────────────────────────────────────────────

const KRITERIA_MAKANAN = [
  "Nama Makanan", "Kategori Makanan",
  "Kalori Tinggi", "Karbo Tinggi", "Protein Tinggi",
  "Lemak Tinggi", "IG Tinggi", "Kategori"
];

// 20 dataset makanan untuk pasien Diabetes Melitus
const DATASET_MAKANAN = [
  // ── Karbohidrat ──────────────────────────────────────────────────────────
  { "Nama Makanan": "Nasi Merah",       "Kategori Makanan": "Karbohidrat", "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Nasi Putih",       "Kategori Makanan": "Karbohidrat", "Kalori Tinggi": "Ya",    "Karbo Tinggi": "Ya",    "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
  { "Nama Makanan": "Kentang Rebus",    "Kategori Makanan": "Karbohidrat", "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Ya",    "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
  { "Nama Makanan": "Ubi Jalar",        "Kategori Makanan": "Karbohidrat", "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Oatmeal",          "Kategori Makanan": "Karbohidrat", "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },

  // ── Protein ──────────────────────────────────────────────────────────────
  { "Nama Makanan": "Ayam Kukus",       "Kategori Makanan": "Protein",     "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Ikan Panggang",    "Kategori Makanan": "Protein",     "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Tahu Rebus",       "Kategori Makanan": "Protein",     "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Tempe Bacem",      "Kategori Makanan": "Protein",     "Kalori Tinggi": "Ya",    "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Ya",    "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
  { "Nama Makanan": "Daging Sapi Goreng","Kategori Makanan": "Protein",    "Kalori Tinggi": "Ya",    "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Ya",    "IG Tinggi": "Tidak", "Kategori": "Tidak Boleh" },

  // ── Sayuran (Serat) ──────────────────────────────────────────────────────
  { "Nama Makanan": "Brokoli Rebus",    "Kategori Makanan": "Serat",       "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Bayam Rebus",      "Kategori Makanan": "Serat",       "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Wortel Kukus",     "Kategori Makanan": "Serat",       "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },

  // ── Buah ─────────────────────────────────────────────────────────────────
  { "Nama Makanan": "Apel",             "Kategori Makanan": "Buah",        "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Pisang",           "Kategori Makanan": "Buah",        "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Ya",    "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
  { "Nama Makanan": "Jeruk",            "Kategori Makanan": "Buah",        "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Semangka",         "Kategori Makanan": "Buah",        "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Tidak", "Lemak Tinggi": "Tidak", "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },

  // ── Cemilan ──────────────────────────────────────────────────────────────
  { "Nama Makanan": "Kacang Almond",    "Kategori Makanan": "Cemilan",     "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Yoghurt Plain",    "Kategori Makanan": "Cemilan",     "Kalori Tinggi": "Tidak", "Karbo Tinggi": "Tidak", "Protein Tinggi": "Ya",    "Lemak Tinggi": "Tidak", "IG Tinggi": "Tidak", "Kategori": "Boleh" },
  { "Nama Makanan": "Donat",            "Kategori Makanan": "Cemilan",     "Kalori Tinggi": "Ya",    "Karbo Tinggi": "Ya",    "Protein Tinggi": "Tidak", "Lemak Tinggi": "Ya",    "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
  { "Nama Makanan": "Kerupuk",          "Kategori Makanan": "Cemilan",     "Kalori Tinggi": "Ya",    "Karbo Tinggi": "Ya",    "Protein Tinggi": "Tidak", "Lemak Tinggi": "Ya",    "IG Tinggi": "Ya",    "Kategori": "Tidak Boleh" },
];

// ─────────────────────────────────────────────────────────────────────────────
const SeederPage = () => {
  const navigate = useNavigate();
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const addLog = (msg, type = "info") =>
    setLog(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  };

  const runSeed = async () => {
    setRunning(true); setDone(false); setLog([]);
    const headers = getHeaders();

    try {
      // ── 1. Hapus dataset lama ───────────────────────────────────────────
      addLog("Menghapus dataset defisit lama...");
      try {
        const resD = await axios.get(`${API_URL}/dataset-defisit`, { headers });
        for (const item of resD.data) {
          await axios.delete(`${API_URL}/dataset-defisit/${item.id}`, { headers });
        }
        addLog(`✓ ${resD.data.length} dataset defisit lama dihapus`, "success");
      } catch { addLog("Dataset defisit kosong atau gagal dihapus", "warn"); }

      addLog("Menghapus dataset surplus lama...");
      try {
        const resS = await axios.get(`${API_URL}/dataset-surplus`, { headers });
        for (const item of resS.data) {
          await axios.delete(`${API_URL}/dataset-surplus/${item.id}`, { headers });
        }
        addLog(`✓ ${resS.data.length} dataset surplus lama dihapus`, "success");
      } catch { addLog("Dataset surplus kosong atau gagal dihapus", "warn"); }

      // ── 2. Hapus kriteria lama ──────────────────────────────────────────
      addLog("Menghapus kriteria defisit lama...");
      try {
        const resKD = await axios.get(`${API_URL}/kriteria-defisit`, { headers });
        for (const item of resKD.data) {
          await axios.delete(`${API_URL}/kriteria-defisit/${item.id}`, { headers });
        }
        addLog(`✓ ${resKD.data.length} kriteria defisit lama dihapus`, "success");
      } catch { addLog("Kriteria defisit kosong atau gagal dihapus", "warn"); }

      addLog("Menghapus kriteria surplus lama...");
      try {
        const resKS = await axios.get(`${API_URL}/kriteria-surplus`, { headers });
        for (const item of resKS.data) {
          await axios.delete(`${API_URL}/kriteria-surplus/${item.id}`, { headers });
        }
        addLog(`✓ ${resKS.data.length} kriteria surplus lama dihapus`, "success");
      } catch { addLog("Kriteria surplus kosong atau gagal dihapus", "warn"); }

      // ── 3. Seed kriteria defisit ────────────────────────────────────────
      addLog("Menyimpan kriteria defisit baru...");
      for (const nama of KRITERIA_DEFISIT) {
        await axios.post(`${API_URL}/kriteria-defisit`,
          { namaKriteria: nama }, { headers });
      }
      addLog(`✓ ${KRITERIA_DEFISIT.length} kriteria defisit berhasil disimpan`, "success");

      // ── 4. Seed kriteria surplus ────────────────────────────────────────
      addLog("Menyimpan kriteria surplus baru...");
      for (const nama of KRITERIA_SURPLUS) {
        await axios.post(`${API_URL}/kriteria-surplus`,
          { namaKriteria: nama }, { headers });
      }
      addLog(`✓ ${KRITERIA_SURPLUS.length} kriteria surplus berhasil disimpan`, "success");

      // ── 5. Seed dataset defisit ─────────────────────────────────────────
      addLog("Menyimpan 13 dataset defisit...");
      for (const nilai of DATASET_DEFISIT) {
        await axios.post(`${API_URL}/dataset-defisit`,
          { nilai }, { headers });
      }
      addLog(`✓ ${DATASET_DEFISIT.length} dataset defisit berhasil disimpan`, "success");

      // ── 6. Seed dataset surplus ─────────────────────────────────────────
      addLog("Menyimpan 13 dataset surplus...");
      for (const nilai of DATASET_SURPLUS) {
        await axios.post(`${API_URL}/dataset-surplus`,
          { nilai }, { headers });
      }
      addLog(`✓ ${DATASET_SURPLUS.length} dataset surplus berhasil disimpan`, "success");

      // ── 7. Hapus dataset makanan lama ───────────────────────────────────
      addLog("Menghapus dataset makanan lama...");
      try {
        const resM = await axios.get(`${API_URL}/dataset-makanan`, { headers });
        for (const item of resM.data) {
          await axios.delete(`${API_URL}/dataset-makanan/${item.id}`, { headers });
        }
        addLog(`✓ ${resM.data.length} dataset makanan lama dihapus`, "success");
      } catch { addLog("Dataset makanan kosong atau gagal dihapus", "warn"); }

      // ── 8. Hapus kriteria makanan lama ──────────────────────────────────
      addLog("Menghapus kriteria makanan lama...");
      try {
        const resKM = await axios.get(`${API_URL}/kriteria-makanan`, { headers });
        for (const item of resKM.data) {
          await axios.delete(`${API_URL}/kriteria-makanan/${item.id}`, { headers });
        }
        addLog(`✓ ${resKM.data.length} kriteria makanan lama dihapus`, "success");
      } catch { addLog("Kriteria makanan kosong atau gagal dihapus", "warn"); }

      // ── 9. Seed kriteria makanan ────────────────────────────────────────
      addLog("Menyimpan kriteria makanan baru...");
      for (const nama of KRITERIA_MAKANAN) {
        await axios.post(`${API_URL}/kriteria-makanan`,
          { namaKriteria: nama }, { headers });
      }
      addLog(`✓ ${KRITERIA_MAKANAN.length} kriteria makanan berhasil disimpan`, "success");

      // ── 10. Seed dataset makanan ────────────────────────────────────────
      addLog("Menyimpan 20 dataset makanan...");
      for (const nilai of DATASET_MAKANAN) {
        await axios.post(`${API_URL}/dataset-makanan`,
          { nilai }, { headers });
      }
      addLog(`✓ ${DATASET_MAKANAN.length} dataset makanan berhasil disimpan`, "success");

      addLog("🎉 Semua data berhasil di-seed!", "success");
      setDone(true);

    } catch (e) {
      addLog(`❌ Error: ${e.response?.data?.msg || e.message}`, "error");
    } finally {
      setRunning(false);
    }
  };

  const logColor = { info: "text-white/70", success: "text-green-400", warn: "text-yellow-400", error: "text-red-400" };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 pt-20 sm:pt-24 md:pt-6 px-4 sm:px-6 pb-6">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-6 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-indigo-500/30 rounded-xl flex items-center justify-center">
                <FaDatabase className="w-5 h-5 text-indigo-300" />
              </div>
              <h1 className="text-2xl font-bold text-white">Seed Data Kriteria & Dataset</h1>
            </div>
            <p className="text-white/70 text-sm ml-13">
              Halaman ini akan menghapus semua kriteria & dataset pasien lama, lalu mengisinya kembali dengan
              data lengkap 5 atribut: <strong className="text-white">Jenis Kelamin, Aktivitas, IMT, Usia, Tingkat Stres</strong> sesuai skripsi.
            </p>
          </div>

          {/* Preview data */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Dataset Defisit", data: DATASET_DEFISIT, color: "orange" },
              { label: "Dataset Surplus", data: DATASET_SURPLUS, color: "blue" },
            ].map(({ label, data, color }) => (
              <div key={label} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden">
                <div className={`bg-gradient-to-r from-${color}-600/70 to-${color}-700/70 px-4 py-3`}>
                  <p className="text-white font-semibold text-sm">{label} — {data.length} data</p>
                </div>
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>{["JK","Akt","IMT","Usia","Stres","Main"].map(h => (
                        <th key={h} className="px-2 py-1.5 text-white/60 text-left">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.map((row, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="px-2 py-1.5 text-white/80">{row["Jenis Kelamin"]}</td>
                          <td className="px-2 py-1.5 text-white/80">{row["Aktivitas"]}</td>
                          <td className="px-2 py-1.5 text-white/80">{row["IMT"]}</td>
                          <td className="px-2 py-1.5 text-blue-300">{row["Usia"]}</td>
                          <td className="px-2 py-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              row["Tingkat Stres"] === "Rendah" ? "bg-green-500/20 text-green-400"
                              : row["Tingkat Stres"] === "Sedang" ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"}`}>
                              {row["Tingkat Stres"]}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <span className={`font-semibold ${row["Main"] === "Ya" ? "text-green-400" : "text-red-400"}`}>
                              {row["Main"]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Preview Makanan */}
          <div className="mb-6 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600/70 to-teal-700/70 px-4 py-3">
              <p className="text-white font-semibold text-sm">Dataset Makanan — {DATASET_MAKANAN.length} data</p>
            </div>
            <div className="overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-white/5 sticky top-0">
                  <tr>{["Nama","Kategori","Kalori","Karbo","Protein","Lemak","IG","Keputusan"].map(h => (
                    <th key={h} className="px-2 py-1.5 text-white/60 text-left">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {DATASET_MAKANAN.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="px-2 py-1.5 text-white/90 font-medium">{row["Nama Makanan"]}</td>
                      <td className="px-2 py-1.5 text-blue-300">{row["Kategori Makanan"]}</td>
                      <td className="px-2 py-1.5 text-white/70">{row["Kalori Tinggi"]}</td>
                      <td className="px-2 py-1.5 text-white/70">{row["Karbo Tinggi"]}</td>
                      <td className="px-2 py-1.5 text-white/70">{row["Protein Tinggi"]}</td>
                      <td className="px-2 py-1.5 text-white/70">{row["Lemak Tinggi"]}</td>
                      <td className="px-2 py-1.5 text-white/70">{row["IG Tinggi"]}</td>
                      <td className="px-2 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${row["Kategori"] === "Boleh" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {row["Kategori"]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tombol seed */}
          <div className="mb-6 flex gap-4 flex-wrap">
            <button onClick={runSeed} disabled={running}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105">
              {running ? <FaSpinner className="w-5 h-5 animate-spin" /> : <FaSeedling className="w-5 h-5" />}
              {running ? "Sedang memproses..." : "Jalankan Seed Data"}
            </button>
            {done && (
              <button onClick={() => navigate("/dataset-pasien")}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300">
                <FaCheckCircle className="w-5 h-5" />
                Lihat Dataset
              </button>
            )}
          </div>

          {/* Warning */}
          {!done && !running && (
            <div className="mb-6 flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <FaExclamationTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-yellow-300 text-sm">
                Proses ini akan <strong>menghapus semua kriteria & dataset pasien yang ada</strong> dan menggantinya dengan data baru.
                Pastikan sudah login sebagai admin sebelum menjalankan.
              </p>
            </div>
          )}

          {/* Log output */}
          {log.length > 0 && (
            <div className="backdrop-blur-xl bg-black/30 border border-white/10 rounded-xl p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
              {log.map((entry, i) => (
                <div key={i} className={`flex gap-2 ${logColor[entry.type]}`}>
                  <span className="text-white/30 flex-shrink-0">{entry.time}</span>
                  <span>{entry.msg}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SeederPage;
