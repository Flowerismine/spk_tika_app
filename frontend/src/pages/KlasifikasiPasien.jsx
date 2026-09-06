import API_URL from "../api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaUserPlus, FaSpinner, FaCheckCircle, FaUtensils, FaBan, FaSave, FaPrint, FaArrowLeft } from "react-icons/fa";

// ─── Konfigurasi dropdown untuk input pasien ────────────────────────────────
const INPUT_CONFIG = {
  "Jenis Kelamin": ["Pria", "Wanita"],
  "Aktivitas":     ["Ringan", "Sedang", "Berat"],
  "Tingkat Stres": ["Rendah", "Sedang", "Tinggi"],
};

// ─── Konversi usia angka → kategori (PERKENI 2021 + ekspansi untuk <30) ────
const konversiUsia = (angka) => {
  if (!angka || isNaN(angka)) return { kategori: "", label: "" };
  const usia = parseInt(angka);
  if (usia < 18) return { kategori: "", label: "⚠️ Sistem dirancang untuk pasien dewasa (≥18 tahun)" };
  if (usia < 30) return { kategori: "Dewasa", label: "Dewasa Muda — diproses sebagai Dewasa" };
  if (usia <= 45) return { kategori: "Dewasa", label: "Dewasa (30–45 tahun)" };
  if (usia <= 59) return { kategori: "Lansia Awal", label: "Lansia Awal (46–59 tahun)" };
  return { kategori: "Lansia", label: "Lansia (≥60 tahun)" };
};

// ─── Konversi IMT dari BB & TB ke kategori (WHO Asia-Pacific di skripsi) ───
const hitungIMT = (bbKg, tbCm) => {
  if (!bbKg || !tbCm || isNaN(bbKg) || isNaN(tbCm) || tbCm <= 0) {
    return { imt: null, kategori: "", label: "" };
  }
  const bb = parseFloat(bbKg);
  const tb = parseFloat(tbCm) / 100;  // konversi ke meter
  const imt = bb / (tb * tb);
  const imtRounded = Math.round(imt * 10) / 10;

  let kategori = "";
  let label = "";
  if (imt < 18.5)       { kategori = "Underweight"; label = "Underweight (<18.5)"; }
  else if (imt < 21.0)  { kategori = "Kurang";      label = "Kurang (18.5–20.9)"; }
  else if (imt < 25.0)  { kategori = "Normal";      label = "Normal (21–24.9)"; }
  else if (imt < 27.5)  { kategori = "Berlebih";    label = "Berlebih (25–27.4)"; }
  else                  { kategori = "Overweight";  label = "Overweight (≥27.5)"; }

  return { imt: imtRounded, kategori, label };
};

// ─── Logic Naive Bayes — sama persis seperti di halaman Perhitungan ─────────
const calculateNaiveBayes = (dataset, atribut, kelas1Key, kelas2Key, targetColumn = "Main") => {
  if (dataset.length === 0) return null;
  const totalData = dataset.length;
  const count1 = dataset.filter(d => d.nilai?.[targetColumn] === kelas1Key).length;
  const count2 = totalData - count1;
  const probKelas = {
    [kelas1Key]: count1 / totalData,
    [kelas2Key]: count2 / totalData,
  };
  const probAtribut = {};
  atribut.forEach(attr => {
    probAtribut[attr] = { [kelas1Key]: {}, [kelas2Key]: {} };
    const uniqueValues = [...new Set(dataset.map(d => d.nilai?.[attr]).filter(Boolean))];
    uniqueValues.forEach(val => {
      const jml1 = dataset.filter(d => d.nilai?.[attr] === val && d.nilai?.[targetColumn] === kelas1Key).length;
      const jml2 = dataset.filter(d => d.nilai?.[attr] === val && d.nilai?.[targetColumn] === kelas2Key).length;
      probAtribut[attr][kelas1Key][val] = count1 > 0 ? jml1 / count1 : 0;
      probAtribut[attr][kelas2Key][val] = count2 > 0 ? jml2 / count2 : 0;
    });
  });
  return { probKelas, probAtribut, count1, count2, totalData };
};

const predictPasien = (model, nilaiInput, atribut, kelas1Key, kelas2Key) => {
  if (!model) return null;
  let p1 = model.probKelas[kelas1Key];
  let p2 = model.probKelas[kelas2Key];
  atribut.forEach(attr => {
    const val = nilaiInput[attr];
    if (val) {
      p1 *= model.probAtribut[attr][kelas1Key][val] ?? 0;
      p2 *= model.probAtribut[attr][kelas2Key][val] ?? 0;
    }
  });
  return { p1, p2, hasil: p1 > p2 ? kelas1Key : kelas2Key };
};

const KlasifikasiPasien = () => {
  const [namaPasien, setNamaPasien] = useState("");
  const [usiaAngka,  setUsiaAngka]  = useState("");      // input angka usia
  const [usiaLabel,  setUsiaLabel]  = useState("");      // label kategori usia
  const [beratBadan, setBeratBadan] = useState("");      // BB (kg)
  const [tinggiBadan, setTinggiBadan] = useState("");    // TB (cm)
  const [imtInfo, setImtInfo] = useState({ imt: null, kategori: "", label: "" });
  const [nilai, setNilai] = useState({
    "Jenis Kelamin": "", "Aktivitas": "", "IMT": "", "Usia": "", "Tingkat Stres": "",
  });

  const [datasetDefisit, setDatasetDefisit] = useState([]);
  const [datasetSurplus, setDatasetSurplus] = useState([]);
  const [datasetMakanan, setDatasetMakanan] = useState([]);

  const [hasilKlasifikasi, setHasilKlasifikasi] = useState(null);
  const [rekomendasiMakanan, setRekomendasiMakanan] = useState({ boleh: [], tidakBoleh: [] });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => { dispatch(getMe()); }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
    else loadDatasets();
  }, [navigate]);

  const loadDatasets = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [resD, resS, resM] = await Promise.all([
        axios.get(`${API_URL}/dataset-defisit`, { headers }),
        axios.get(`${API_URL}/dataset-surplus`, { headers }),
        axios.get(`${API_URL}/dataset-makanan`, { headers }),
      ]);
      setDatasetDefisit(resD.data);
      setDatasetSurplus(resS.data);
      setDatasetMakanan(resM.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (key, value) => {
    setNilai(prev => ({ ...prev, [key]: value }));
    setHasilKlasifikasi(null);
    setSavedId(null);
  };

  const handleUsiaChange = (e) => {
    const val = e.target.value;
    setUsiaAngka(val);
    const result = konversiUsia(val);
    setUsiaLabel(result.label);
    setNilai(prev => ({ ...prev, "Usia": result.kategori }));
    setHasilKlasifikasi(null);
    setSavedId(null);
  };

  const handleBBTBChange = (which, value) => {
    const bb = which === "bb" ? value : beratBadan;
    const tb = which === "tb" ? value : tinggiBadan;
    if (which === "bb") setBeratBadan(value);
    if (which === "tb") setTinggiBadan(value);

    const result = hitungIMT(bb, tb);
    setImtInfo(result);
    setNilai(prev => ({ ...prev, "IMT": result.kategori }));
    setHasilKlasifikasi(null);
    setSavedId(null);
  };

  const klasifikasi = () => {
    // Validasi input
    if (!namaPasien.trim()) { alert("Nama pasien wajib diisi"); return; }
    
    const bb = parseFloat(beratBadan);
    const tb = parseFloat(tinggiBadan);
    const usia = parseInt(usiaAngka);

    if (isNaN(bb) || bb < 20 || bb > 350) {
      alert("Harap masukkan berat badan yang valid (20 - 350 kg)");
      return;
    }
    if (isNaN(tb) || tb < 50 || tb > 250) {
      alert("Harap masukkan tinggi badan yang valid (50 - 250 cm)");
      return;
    }
    if (isNaN(usia) || usia < 1 || usia > 125) {
      alert("Harap masukkan usia yang valid (1 - 125 tahun)");
      return;
    }

    const empty = Object.entries(nilai).filter(([, v]) => !v);
    if (empty.length > 0) {
      alert(`Lengkapi: ${empty.map(([k]) => k).join(", ")}`);
      return;
    }
    if (datasetDefisit.length === 0 || datasetSurplus.length === 0) {
      alert("Dataset training masih kosong. Buka halaman /seeder untuk mengisi data.");
      return;
    }

    setLoading(true);

    // Atribut yang dipakai
    const atribut = ["Jenis Kelamin", "Aktivitas", "IMT", "Usia", "Tingkat Stres"];

    // Hitung Naive Bayes pakai dataset Defisit
    const modelDefisit = calculateNaiveBayes(datasetDefisit, atribut, "Ya", "Tidak");
    const prediksiDefisit = predictPasien(modelDefisit, nilai, atribut, "Ya", "Tidak");

    // Hitung Naive Bayes pakai dataset Surplus
    const modelSurplus = calculateNaiveBayes(datasetSurplus, atribut, "Ya", "Tidak");
    const prediksiSurplus = predictPasien(modelSurplus, nilai, atribut, "Ya", "Tidak");

    // Tentukan kategori akhir
    let kategori;
    if (prediksiDefisit.hasil === "Ya" && prediksiSurplus.hasil === "Tidak") {
      kategori = "Defisit Kalori";
    } else if (prediksiDefisit.hasil === "Tidak" && prediksiSurplus.hasil === "Ya") {
      kategori = "Surplus Kalori";
    } else if (prediksiDefisit.hasil === "Ya" && prediksiSurplus.hasil === "Ya") {
      kategori = prediksiDefisit.p1 > prediksiSurplus.p1 ? "Defisit Kalori" : "Surplus Kalori";
    } else {
      kategori = "Kalori Normal";
    }

    // Bangun breakdown perhitungan untuk ditampilkan ke user
    const buildBreakdown = (model, kelas) => {
      const items = [];
      let totalProduk = model.probKelas[kelas];
      items.push({
        keterangan: `P(${kelas})`,
        nilaiAtribut: "-",
        rumus: `${model[kelas === "Ya" ? "count1" : "count2"]} ÷ ${model.totalData}`,
        hasil: model.probKelas[kelas].toFixed(4),
        akumulasi: totalProduk.toFixed(6),
      });
      atribut.forEach(attr => {
        const val = nilai[attr];
        const p = model.probAtribut[attr][kelas][val] ?? 0;
        totalProduk *= p;
        items.push({
          keterangan: `× P(${attr}=${val} | ${kelas})`,
          nilaiAtribut: val,
          rumus: `Lihat tabel atribut`,
          hasil: p.toFixed(4),
          akumulasi: totalProduk.toFixed(6),
        });
      });
      return { items, total: totalProduk };
    };

    const breakdownDefisitYa    = buildBreakdown(modelDefisit, "Ya");
    const breakdownDefisitTidak = buildBreakdown(modelDefisit, "Tidak");
    const breakdownSurplusYa    = buildBreakdown(modelSurplus, "Ya");
    const breakdownSurplusTidak = buildBreakdown(modelSurplus, "Tidak");

    setHasilKlasifikasi({
      kategori,
      probDefisitYa:    prediksiDefisit.p1,
      probDefisitTidak: prediksiDefisit.p2,
      probSurplusYa:    prediksiSurplus.p1,
      probSurplusTidak: prediksiSurplus.p2,
      hasilDefisit:     prediksiDefisit.hasil,
      hasilSurplus:     prediksiSurplus.hasil,
      breakdownDefisitYa,
      breakdownDefisitTidak,
      breakdownSurplusYa,
      breakdownSurplusTidak,
    });

    // Hitung rekomendasi makanan
    hitungRekomendasiMakanan(kategori);

    setLoading(false);
  };

  const hitungRekomendasiMakanan = (kategori) => {
    if (datasetMakanan.length === 0) {
      setRekomendasiMakanan({ boleh: [], tidakBoleh: [], kategori });
      return;
    }

    // ── LAYER 1: KLASIFIKASI NAIVE BAYES MAKANAN ──────────────────────
    // Konsisten dengan Halaman Pembuktian Makanan
    const atributMakanan = ["Kalori Tinggi", "Karbo Tinggi", "Protein Tinggi", "Lemak Tinggi", "IG Tinggi"];
    const modelMakanan = calculateNaiveBayes(datasetMakanan, atributMakanan, "Boleh", "Tidak Boleh", "Kategori");

    const boleh = [];
    const tidakBoleh = [];

    datasetMakanan.forEach(m => {
      const prediksi = predictPasien(modelMakanan, m.nilai || {}, atributMakanan, "Boleh", "Tidak Boleh");
      const namaMakanan     = m.nilai?.["Nama Makanan"]     || "-";
      const kategoriMakanan = m.nilai?.["Kategori Makanan"] || "-";
      const kaloriTinggi    = m.nilai?.["Kalori Tinggi"]    === "Ya";
      const lemakTinggi     = m.nilai?.["Lemak Tinggi"]     === "Ya";
      const igTinggi        = m.nilai?.["IG Tinggi"]        === "Ya";

      const item = {
        nama: namaMakanan,
        kategoriMakanan,
        kaloriTinggi: m.nilai?.["Kalori Tinggi"] || "-",
      };

      // ── LAYER 2: FILTER KLINIS BERBASIS KATEGORI PASIEN ─────────────
      let bolehkah;
      if (kategori === "Defisit Kalori") {
        // Diet ketat rendah kalori: hanya Sayur + Buah + Protein rendah lemak
        const adalahSayur   = kategoriMakanan === "Serat";
        const adalahBuah    = kategoriMakanan === "Buah";
        const adalahProtein = kategoriMakanan === "Protein";
        bolehkah = !igTinggi && !kaloriTinggi && !lemakTinggi && (adalahSayur || adalahBuah || adalahProtein);
      }
      else if (kategori === "Surplus Kalori") {
        // Padat kalori & gizi: Karbohidrat + Protein + Cemilan, hindari IG Tinggi
        const adalahKarbo   = kategoriMakanan === "Karbohidrat";
        const adalahProtein = kategoriMakanan === "Protein";
        const adalahCemilan = kategoriMakanan === "Cemilan";
        bolehkah = !igTinggi && (adalahKarbo || adalahProtein || adalahCemilan);
      }
      else {
        // Kalori Normal → pakai hasil Naive Bayes apa adanya
        bolehkah = prediksi.hasil === "Boleh";
      }

      if (bolehkah) boleh.push(item);
      else tidakBoleh.push(item);
    });

    setRekomendasiMakanan({ boleh, tidakBoleh, kategori });
  };

  const simpanPasien = async () => {
    if (!hasilKlasifikasi) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const metadata = {
        usiaAngka,
        beratBadan,
        tinggiBadan,
        imtAngka: imtInfo.imt,
        nilai,
        rekomendasi: rekomendasiMakanan,
        tanggal: new Date().toISOString()
      };

      const res = await axios.post(`${API_URL}/pasien-baru`, {
        namaPasien: namaPasien.trim(),
        kategori: hasilKlasifikasi.kategori,
        metadata
      }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });
      setSavedId(res.data.data?.id);
      alert("✅ Pasien berhasil disimpan ke database klinik!");
    } catch (e) {
      alert(e.response?.data?.msg || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const cetakLaporan = () => {
    // Simpan data ke localStorage agar bisa diakses CetakLaporan
    const data = {
      namaPasien,
      nilai,
      usiaAngka,
      beratBadan,
      tinggiBadan,
      imtAngka: imtInfo.imt,
      kategori: hasilKlasifikasi?.kategori,
      rekomendasi: rekomendasiMakanan,
      tanggal: new Date().toLocaleDateString("id-ID", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      }),
    };
    localStorage.setItem("cetakPasienData", JSON.stringify(data));
    window.open("/cetak-pasien", "_blank");
  };

  const resetForm = () => {
    setNamaPasien("");
    setUsiaAngka("");
    setUsiaLabel("");
    setBeratBadan("");
    setTinggiBadan("");
    setImtInfo({ imt: null, kategori: "", label: "" });
    setNilai({ "Jenis Kelamin": "", "Aktivitas": "", "IMT": "", "Usia": "", "Tingkat Stres": "" });
    setHasilKlasifikasi(null);
    setRekomendasiMakanan({ boleh: [], tidakBoleh: [] });
    setSavedId(null);
  };

  const kategoriColor = {
    "Defisit Kalori": "from-orange-500 to-red-500",
    "Surplus Kalori": "from-blue-500 to-indigo-500",
    "Kalori Normal":  "from-green-500 to-emerald-500",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 pt-20 sm:pt-24 md:pt-6 px-4 sm:px-6 pb-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="mb-6 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center">
                <FaUserPlus className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Klasifikasi Pasien Baru</h1>
                <p className="text-white/70 text-sm">Input data pasien untuk mendapatkan klasifikasi kalori dan rekomendasi menu makanan</p>
              </div>
            </div>
          </div>

          {/* Form Input */}
          <div className="mb-6 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 p-4 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">📋 Data Pasien</h2>
            </div>
            <div className="p-6">
              {/* Nama */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">Nama Lengkap Pasien <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={namaPasien}
                  onChange={(e) => { setNamaPasien(e.target.value); setHasilKlasifikasi(null); setSavedId(null); }}
                  placeholder="Contoh: Slamat Rianto"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              {/* Atribut Pasien */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Input Usia (Angka) — Auto-classify ke kategori */}
                <div>
                  <label className="block text-white font-semibold mb-2">Usia (tahun) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={usiaAngka}
                    onChange={handleUsiaChange}
                    placeholder="Contoh: 40"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  {usiaAngka && (
                    <p className={`text-xs mt-2 ${
                      !nilai.Usia ? "text-yellow-400"
                      : nilai.Usia === "Dewasa"      ? "text-blue-300"
                      : nilai.Usia === "Lansia Awal" ? "text-orange-300"
                      : "text-pink-300"
                    } font-semibold`}>
                      → {usiaLabel}
                    </p>
                  )}
                </div>

                {/* Input Berat Badan */}
                <div>
                  <label className="block text-white font-semibold mb-2">Berat Badan (kg) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    step="0.1"
                    value={beratBadan}
                    onChange={(e) => handleBBTBChange("bb", e.target.value)}
                    placeholder="Contoh: 65"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                {/* Input Tinggi Badan */}
                <div>
                  <label className="block text-white font-semibold mb-2">Tinggi Badan (cm) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    min="0"
                    max="250"
                    step="0.1"
                    value={tinggiBadan}
                    onChange={(e) => handleBBTBChange("tb", e.target.value)}
                    placeholder="Contoh: 165"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>

                {/* Preview IMT — full width */}
                {imtInfo.imt && (
                  <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-white/70 text-xs mb-1">Indeks Massa Tubuh (otomatis):</p>
                        <p className="text-white text-2xl font-bold font-mono">
                          IMT = {beratBadan} ÷ ({tinggiBadan}/100)² = {imtInfo.imt}
                        </p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs mb-1">Kategori:</p>
                        <span className={`inline-block px-4 py-2 rounded-lg font-bold text-sm ${
                          imtInfo.kategori === "Underweight" ? "bg-blue-500/30 text-blue-200"
                          : imtInfo.kategori === "Kurang"     ? "bg-cyan-500/30 text-cyan-200"
                          : imtInfo.kategori === "Normal"     ? "bg-green-500/30 text-green-200"
                          : imtInfo.kategori === "Berlebih"   ? "bg-orange-500/30 text-orange-200"
                          : "bg-red-500/30 text-red-200"
                        }`}>
                          {imtInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {Object.entries(INPUT_CONFIG).map(([key, options]) => (
                  <div key={key}>
                    <label className="block text-white font-semibold mb-2">{key} <span className="text-red-400">*</span></label>
                    <select
                      value={nilai[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-800">Pilih {key}</option>
                      {options.map(opt => (
                        <option key={opt} value={opt} className="bg-slate-800">{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Tombol Klasifikasi */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={klasifikasi}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {loading ? <FaSpinner className="w-5 h-5 animate-spin" /> : <FaCheckCircle className="w-5 h-5" />}
                  {loading ? "Memproses..." : "Klasifikasi Pasien"}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-white rounded-xl transition-all duration-300"
                >
                  Reset Form
                </button>
              </div>
            </div>
          </div>

          {/* Hasil Klasifikasi */}
          {hasilKlasifikasi && (
            <>
              <div className="mb-6 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
                <div className={`bg-gradient-to-r ${kategoriColor[hasilKlasifikasi.kategori]} p-6`}>
                  <p className="text-white/80 text-sm mb-1">Hasil Klasifikasi Kalori</p>
                  <h2 className="text-3xl font-bold text-white mb-3">{namaPasien}</h2>
                  <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                    <span className="text-white font-bold text-lg">📊 {hasilKlasifikasi.kategori}</span>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/60 mb-2 font-semibold">Probabilitas Dataset Defisit:</p>
                    <p className="text-green-400">P(Ya) = {hasilKlasifikasi.probDefisitYa.toFixed(6)}</p>
                    <p className="text-red-400">P(Tidak) = {hasilKlasifikasi.probDefisitTidak.toFixed(6)}</p>
                    <p className="text-white/70 text-xs mt-2 italic">→ Hasil: <strong>{hasilKlasifikasi.hasilDefisit}</strong> butuh Defisit</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/60 mb-2 font-semibold">Probabilitas Dataset Surplus:</p>
                    <p className="text-green-400">P(Ya) = {hasilKlasifikasi.probSurplusYa.toFixed(6)}</p>
                    <p className="text-red-400">P(Tidak) = {hasilKlasifikasi.probSurplusTidak.toFixed(6)}</p>
                    <p className="text-white/70 text-xs mt-2 italic">→ Hasil: <strong>{hasilKlasifikasi.hasilSurplus}</strong> butuh Surplus</p>
                  </div>
                </div>
              </div>

              {/* Breakdown Perhitungan Detail */}
              <div className="mb-6 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-700/80 to-purple-700/80 p-4 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white">🔍 Detail Perhitungan Naive Bayes</h2>
                  <p className="text-white/70 text-xs mt-1">Bagaimana sistem sampai ke kesimpulan di atas</p>
                </div>
                <div className="p-4 sm:p-6 space-y-6">

                  {/* Banner penjelasan */}
                  <div className="bg-amber-500/10 border-l-4 border-amber-400 rounded-r-lg p-3">
                    <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                      <strong className="text-amber-300">📚 Bagaimana cara membaca tabel ini?</strong><br />
                      Sistem mengalikan probabilitas kelas dengan probabilitas tiap atribut pasien.
                      Kelas dengan akumulasi tertinggi = hasil prediksi.
                    </p>
                    <p className="text-white/70 text-xs mt-2 font-mono bg-black/20 p-2 rounded">
                      <strong>Rumus:</strong> P(Kelas | Pasien) = P(Kelas) × P(Atribut₁|Kelas) × P(Atribut₂|Kelas) × ... × P(Atribut₅|Kelas)
                    </p>
                  </div>

                  {/* Perhitungan Dataset Defisit */}
                  <div>
                    <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="px-3 py-1 bg-orange-500/30 text-orange-300 rounded-full text-xs">DATASET DEFISIT</span>
                    </h3>

                    {/* Kelas Ya */}
                    <div className="mb-4">
                      <p className="text-green-400 text-sm font-semibold mb-2">Menghitung P(Ya | Pasien) — apakah pasien butuh Defisit?</p>
                      <div className="overflow-x-auto bg-white/5 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left text-white/70">Keterangan</th>
                              <th className="px-3 py-2 text-left text-white/70">Nilai Pasien</th>
                              <th className="px-3 py-2 text-center text-white/70">Hasil</th>
                              <th className="px-3 py-2 text-center text-white/70">Akumulasi P</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {hasilKlasifikasi.breakdownDefisitYa.items.map((item, i) => (
                              <tr key={i} className="hover:bg-white/5">
                                <td className="px-3 py-2 text-white/80 font-mono">{item.keterangan}</td>
                                <td className="px-3 py-2 text-white/80">{item.nilaiAtribut}</td>
                                <td className="px-3 py-2 text-center text-green-300 font-mono font-bold">{item.hasil}</td>
                                <td className="px-3 py-2 text-center text-white/70 font-mono">{item.akumulasi}</td>
                              </tr>
                            ))}
                            <tr className="bg-green-500/10">
                              <td colSpan="3" className="px-3 py-2 text-right text-white font-bold">Hasil Akhir P(Ya | Pasien) =</td>
                              <td className="px-3 py-2 text-center text-green-400 font-mono font-bold text-sm">{hasilKlasifikasi.breakdownDefisitYa.total.toFixed(6)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Kelas Tidak */}
                    <div className="mb-4">
                      <p className="text-red-400 text-sm font-semibold mb-2">Menghitung P(Tidak | Pasien) — apakah pasien tidak butuh Defisit?</p>
                      <div className="overflow-x-auto bg-white/5 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left text-white/70">Keterangan</th>
                              <th className="px-3 py-2 text-left text-white/70">Nilai Pasien</th>
                              <th className="px-3 py-2 text-center text-white/70">Hasil</th>
                              <th className="px-3 py-2 text-center text-white/70">Akumulasi P</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {hasilKlasifikasi.breakdownDefisitTidak.items.map((item, i) => (
                              <tr key={i} className="hover:bg-white/5">
                                <td className="px-3 py-2 text-white/80 font-mono">{item.keterangan}</td>
                                <td className="px-3 py-2 text-white/80">{item.nilaiAtribut}</td>
                                <td className="px-3 py-2 text-center text-red-300 font-mono font-bold">{item.hasil}</td>
                                <td className="px-3 py-2 text-center text-white/70 font-mono">{item.akumulasi}</td>
                              </tr>
                            ))}
                            <tr className="bg-red-500/10">
                              <td colSpan="3" className="px-3 py-2 text-right text-white font-bold">Hasil Akhir P(Tidak | Pasien) =</td>
                              <td className="px-3 py-2 text-center text-red-400 font-mono font-bold text-sm">{hasilKlasifikasi.breakdownDefisitTidak.total.toFixed(6)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Kesimpulan Defisit */}
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                      <p className="text-white text-sm">
                        <strong>Kesimpulan Defisit:</strong> P(Ya) = {hasilKlasifikasi.probDefisitYa.toFixed(6)} {hasilKlasifikasi.probDefisitYa > hasilKlasifikasi.probDefisitTidak ? "&gt;" : "&lt;"} P(Tidak) = {hasilKlasifikasi.probDefisitTidak.toFixed(6)}
                        → <strong className="text-orange-300">{hasilKlasifikasi.hasilDefisit === "Ya" ? "Ya, butuh Defisit" : "Tidak butuh Defisit"}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Perhitungan Dataset Surplus */}
                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full text-xs">DATASET SURPLUS</span>
                    </h3>

                    {/* Kelas Ya */}
                    <div className="mb-4">
                      <p className="text-green-400 text-sm font-semibold mb-2">Menghitung P(Ya | Pasien) — apakah pasien butuh Surplus?</p>
                      <div className="overflow-x-auto bg-white/5 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left text-white/70">Keterangan</th>
                              <th className="px-3 py-2 text-left text-white/70">Nilai Pasien</th>
                              <th className="px-3 py-2 text-center text-white/70">Hasil</th>
                              <th className="px-3 py-2 text-center text-white/70">Akumulasi P</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {hasilKlasifikasi.breakdownSurplusYa.items.map((item, i) => (
                              <tr key={i} className="hover:bg-white/5">
                                <td className="px-3 py-2 text-white/80 font-mono">{item.keterangan}</td>
                                <td className="px-3 py-2 text-white/80">{item.nilaiAtribut}</td>
                                <td className="px-3 py-2 text-center text-green-300 font-mono font-bold">{item.hasil}</td>
                                <td className="px-3 py-2 text-center text-white/70 font-mono">{item.akumulasi}</td>
                              </tr>
                            ))}
                            <tr className="bg-green-500/10">
                              <td colSpan="3" className="px-3 py-2 text-right text-white font-bold">Hasil Akhir P(Ya | Pasien) =</td>
                              <td className="px-3 py-2 text-center text-green-400 font-mono font-bold text-sm">{hasilKlasifikasi.breakdownSurplusYa.total.toFixed(6)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Kelas Tidak */}
                    <div className="mb-4">
                      <p className="text-red-400 text-sm font-semibold mb-2">Menghitung P(Tidak | Pasien) — apakah pasien tidak butuh Surplus?</p>
                      <div className="overflow-x-auto bg-white/5 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="px-3 py-2 text-left text-white/70">Keterangan</th>
                              <th className="px-3 py-2 text-left text-white/70">Nilai Pasien</th>
                              <th className="px-3 py-2 text-center text-white/70">Hasil</th>
                              <th className="px-3 py-2 text-center text-white/70">Akumulasi P</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {hasilKlasifikasi.breakdownSurplusTidak.items.map((item, i) => (
                              <tr key={i} className="hover:bg-white/5">
                                <td className="px-3 py-2 text-white/80 font-mono">{item.keterangan}</td>
                                <td className="px-3 py-2 text-white/80">{item.nilaiAtribut}</td>
                                <td className="px-3 py-2 text-center text-red-300 font-mono font-bold">{item.hasil}</td>
                                <td className="px-3 py-2 text-center text-white/70 font-mono">{item.akumulasi}</td>
                              </tr>
                            ))}
                            <tr className="bg-red-500/10">
                              <td colSpan="3" className="px-3 py-2 text-right text-white font-bold">Hasil Akhir P(Tidak | Pasien) =</td>
                              <td className="px-3 py-2 text-center text-red-400 font-mono font-bold text-sm">{hasilKlasifikasi.breakdownSurplusTidak.total.toFixed(6)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Kesimpulan Surplus */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-white text-sm">
                        <strong>Kesimpulan Surplus:</strong> P(Ya) = {hasilKlasifikasi.probSurplusYa.toFixed(6)} {hasilKlasifikasi.probSurplusYa > hasilKlasifikasi.probSurplusTidak ? "&gt;" : "&lt;"} P(Tidak) = {hasilKlasifikasi.probSurplusTidak.toFixed(6)}
                        → <strong className="text-blue-300">{hasilKlasifikasi.hasilSurplus === "Ya" ? "Ya, butuh Surplus" : "Tidak butuh Surplus"}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Logika Kategori Final */}
                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-base font-semibold text-white mb-3">🎯 Penentuan Kategori Final</h3>
                    <div className={`bg-gradient-to-r ${kategoriColor[hasilKlasifikasi.kategori]} bg-opacity-20 rounded-lg p-4`}>
                      <p className="text-white text-sm leading-relaxed">
                        Hasil Defisit = <strong>{hasilKlasifikasi.hasilDefisit}</strong>, Hasil Surplus = <strong>{hasilKlasifikasi.hasilSurplus}</strong>
                      </p>
                      <p className="text-white text-sm mt-2 italic">
                        {hasilKlasifikasi.hasilDefisit === "Ya" && hasilKlasifikasi.hasilSurplus === "Tidak" && "Karena butuh Defisit & tidak butuh Surplus → Defisit Kalori"}
                        {hasilKlasifikasi.hasilDefisit === "Tidak" && hasilKlasifikasi.hasilSurplus === "Ya" && "Karena tidak butuh Defisit & butuh Surplus → Surplus Kalori"}
                        {hasilKlasifikasi.hasilDefisit === "Tidak" && hasilKlasifikasi.hasilSurplus === "Tidak" && "Karena tidak butuh keduanya → Kalori Normal"}
                        {hasilKlasifikasi.hasilDefisit === "Ya" && hasilKlasifikasi.hasilSurplus === "Ya" && "Karena keduanya butuh (konflik), dipilih probabilitas tertinggi"}
                      </p>
                      <p className="text-white text-lg font-bold mt-3">
                        ✅ Kategori Final: <span className="underline">{hasilKlasifikasi.kategori}</span>
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Rekomendasi Makanan */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Boleh */}
                <div className="backdrop-blur-xl bg-white/10 border border-green-500/30 shadow-2xl rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 p-4 flex items-center gap-3">
                    <FaUtensils className="w-6 h-6 text-white" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Makanan yang BOLEH Dikonsumsi</h3>
                      <p className="text-white/80 text-xs">{rekomendasiMakanan.boleh.length} jenis makanan direkomendasikan</p>
                    </div>
                  </div>
                  <div className="p-4 max-h-96 overflow-y-auto">
                    {rekomendasiMakanan.boleh.length === 0 ? (
                      <p className="text-white/50 text-center py-8">Belum ada data makanan</p>
                    ) : (
                      <div className="space-y-2">
                        {rekomendasiMakanan.boleh.map((m, i) => (
                          <div key={i} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <p className="text-white font-semibold">{m.nama}</p>
                              <p className="text-green-300 text-xs">{m.kategoriMakanan}</p>
                            </div>
                            <span className="text-green-400 text-xs">✓ Aman</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tidak Boleh */}
                <div className="backdrop-blur-xl bg-white/10 border border-red-500/30 shadow-2xl rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-red-600/80 to-rose-600/80 p-4 flex items-center gap-3">
                    <FaBan className="w-6 h-6 text-white" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Makanan yang TIDAK BOLEH Dikonsumsi</h3>
                      <p className="text-white/80 text-xs">{rekomendasiMakanan.tidakBoleh.length} jenis makanan harus dihindari</p>
                    </div>
                  </div>
                  <div className="p-4 max-h-96 overflow-y-auto">
                    {rekomendasiMakanan.tidakBoleh.length === 0 ? (
                      <p className="text-white/50 text-center py-8">Belum ada data makanan</p>
                    ) : (
                      <div className="space-y-2">
                        {rekomendasiMakanan.tidakBoleh.map((m, i) => (
                          <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex justify-between items-center">
                            <div>
                              <p className="text-white font-semibold">{m.nama}</p>
                              <p className="text-red-300 text-xs">{m.kategoriMakanan}</p>
                            </div>
                            <span className="text-red-400 text-xs">✗ Hindari</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6 flex flex-wrap gap-3 justify-center">
                <button
                  onClick={simpanPasien}
                  disabled={saving || savedId}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300"
                >
                  {saving ? <FaSpinner className="w-5 h-5 animate-spin" /> : <FaSave className="w-5 h-5" />}
                  {saving ? "Menyimpan..." : savedId ? "✓ Sudah Disimpan" : "Simpan ke Database"}
                </button>
                <button
                  onClick={cetakLaporan}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300"
                >
                  <FaPrint className="w-5 h-5" />
                  Cetak Laporan
                </button>
                <button
                  onClick={() => navigate("/daftar-pasien")}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-white rounded-xl transition-all duration-300"
                >
                  <FaArrowLeft className="w-5 h-5" />
                  Daftar Pasien
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default KlasifikasiPasien;
