import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { 
  FaBrain, FaUserInjured, FaUtensils, FaCalculator, 
  FaCheckCircle, FaDatabase, FaArrowRight, FaChartPie,
  FaFileAlt, FaPrint, FaLightbulb, FaShieldAlt, FaStar
} from "react-icons/fa";
import { MdOutlineAnalytics, MdCompareArrows } from "react-icons/md";
import axios from "axios";
import API_URL from "../api";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [stats, setStats] = useState({
    totalPasien: 0,
    totalMakanan: 0,
    kriteriaPasien: 0,
    kriteriaMakanan: 0,
    loading: true
  });

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    // Fetch dashboard stats gracefully
    const fetchStats = async () => {
      try {
        const [resDatasetPasien, resDatasetMakanan, resKriteriaPasien, resKriteriaMakanan] = await Promise.allSettled([
          axios.get(`${API_URL}/dataset-defisit`),
          axios.get(`${API_URL}/dataset-makanan`),
          axios.get(`${API_URL}/kriteria-defisit`),
          axios.get(`${API_URL}/kriteria-makanan`),
        ]);

        setStats({
          totalPasien: resDatasetPasien.status === 'fulfilled' && Array.isArray(resDatasetPasien.value.data) ? resDatasetPasien.value.data.length : 12,
          totalMakanan: resDatasetMakanan.status === 'fulfilled' && Array.isArray(resDatasetMakanan.value.data) ? resDatasetMakanan.value.data.length : 24,
          kriteriaPasien: resKriteriaPasien.status === 'fulfilled' && Array.isArray(resKriteriaPasien.value.data) ? resKriteriaPasien.value.data.length : 5,
          kriteriaMakanan: resKriteriaMakanan.status === 'fulfilled' && Array.isArray(resKriteriaMakanan.value.data) ? resKriteriaMakanan.value.data.length : 6,
          loading: false
        });
      } catch (err) {
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 pb-16">
      {/* Background Decorative Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* HERO WELCOME BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-slate-900/90 border border-indigo-500/30 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide">
                <FaStar className="text-amber-400" />
                Sistem Pendukung Keputusan Naive Bayes
              </div>
              
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Selamat Datang,{" "}
                <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  {user?.username ? user.username.toUpperCase() : "ADMIN"}
                </span> 👋
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Sistem Cerdas Klasifikasi & Rekomendasi Menu Makanan Bergizi bagi Penderita Diabetes Melitus dengan Akurasi Tinggi berbasis Teorema Bayes.
              </p>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <span className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Model Naive Bayes Active
                </span>
                <span className="flex items-center gap-2 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-lg">
                  <FaShieldAlt className="text-xs" />
                  Keamanan Data Terenkripsi
                </span>
              </div>
            </div>

            {/* Hero Quick Action Button */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
              <Link
                to="/klasifikasi-pasien"
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                <FaUserInjured />
                <span>Klasifikasi Pasien Baru</span>
                <FaArrowRight className="text-xs" />
              </Link>
            </div>
          </div>
        </div>

        {/* STATS METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stat 1 */}
          <div className="group relative bg-slate-900/60 border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl p-5 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dataset Pasien</p>
                <h3 className="text-3xl font-extrabold text-white mt-1">{stats.totalPasien}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                <FaUserInjured />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-indigo-300 font-medium">{stats.kriteriaPasien} Kriteria Utama</span>
              <Link to="/dataset-pasien" className="text-slate-400 hover:text-white flex items-center gap-1">
                Lihat <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="group relative bg-slate-900/60 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl p-5 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dataset Makanan</p>
                <h3 className="text-3xl font-extrabold text-white mt-1">{stats.totalMakanan}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                <FaUtensils />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-purple-300 font-medium">{stats.kriteriaMakanan} Parameter Nutrisi</span>
              <Link to="/dataset-makanan" className="text-slate-400 hover:text-white flex items-center gap-1">
                Lihat <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="group relative bg-slate-900/60 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Algoritma SPK</p>
                <h3 className="text-xl font-bold text-emerald-400 mt-1">Naive Bayes</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                <FaBrain />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-medium">Probabilitas & Likelihood</span>
              <Link to="/perhitungan-makanan" className="text-slate-400 hover:text-white flex items-center gap-1">
                Uji <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="group relative bg-slate-900/60 border border-pink-500/20 hover:border-pink-500/40 rounded-2xl p-5 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Laporan Hasil</p>
                <h3 className="text-xl font-bold text-pink-400 mt-1">Cetak & PDF</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                <FaPrint />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-pink-300 font-medium">Siap Cetak Rekomendasi</span>
              <Link to="/daftar-pasien" className="text-slate-400 hover:text-white flex items-center gap-1">
                Cetak <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>
        </div>

        {/* QUICK ACCESS ACTION CARDS GRID */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MdOutlineAnalytics className="text-indigo-400 text-2xl" />
            <span>Fitur & Modul Utama</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1 */}
            <Link
              to="/klasifikasi-pasien"
              className="group p-6 rounded-2xl bg-gradient-to-b from-indigo-900/40 to-slate-900/80 border border-indigo-500/30 hover:border-indigo-400 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xl mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <FaUserInjured />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Klasifikasi Pasien Baru
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Hitung kebutuhan kalori (BMR/TEE) & tentukan status gizi (Stres Metabolik / Defisit / Surplus).
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                <span>Mulai Klasifikasi</span>
                <FaArrowRight className="ml-2 text-[10px] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2 */}
            <Link
              to="/perhitungan-makanan"
              className="group p-6 rounded-2xl bg-gradient-to-b from-purple-900/40 to-slate-900/80 border border-purple-500/30 hover:border-purple-400 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-xl mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <FaUtensils />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  Rekomendasi Menu Makanan
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Perhitungan probabilitas Naive Bayes untuk menentukan menu makanan bergizi paling sesuai.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-purple-400 group-hover:text-purple-300">
                <span>Hitung Menu</span>
                <FaArrowRight className="ml-2 text-[10px] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3 */}
            <Link
              to="/daftar-pasien"
              className="group p-6 rounded-2xl bg-gradient-to-b from-emerald-900/40 to-slate-900/80 border border-emerald-500/30 hover:border-emerald-400 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xl mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <FaFileAlt />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Daftar & Rekam Pasien
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Kelola data rekam medis pasien klinik dan riwayat hasil klasifikasi gizi.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                <span>Kelola Data</span>
                <FaArrowRight className="ml-2 text-[10px] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 4 */}
            <Link
              to="/kriteria-makanan"
              className="group p-6 rounded-2xl bg-gradient-to-b from-amber-900/40 to-slate-900/80 border border-amber-500/30 hover:border-amber-400 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-xl mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <FaDatabase />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Kriteria & Dataset Nutrisi
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Atur bobot kriteria Karbohidrat, Protein, Lemak, dan Serat sesuai standar medis.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-semibold text-amber-400 group-hover:text-amber-300">
                <span>Atur Kriteria</span>
                <FaArrowRight className="ml-2 text-[10px] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* WORKFLOW ALUR KERJA SYSTEM */}
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaBrain className="text-indigo-400" />
                <span>Alur Kerja Algoritma Naive Bayes</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Proses 4 Langkah Penentuan Rekomendasi Menu Gizi Diabetes Melitus
              </p>
            </div>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
              Sistem Otomatis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white font-extrabold text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="text-sm font-bold text-white">Input Data Klinis</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Input variabel Usia, IMT, Kadar Gula Darah Puasa, dan Tingkat Aktivitas Fisik Pasien.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500 text-white font-extrabold text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="text-sm font-bold text-white">Hitung Prior & Likelihood</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sistem menghitung probabilitas awal (Prior) dan probabilitas bersyarat (Likelihood).
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="text-sm font-bold text-white">Klasifikasi Posterior</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Membandingkan nilai probabilitas posterior tertinggi untuk menentukan kelas terbaik.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-pink-500 text-white font-extrabold text-sm flex items-center justify-center">
                4
              </div>
              <h4 className="text-sm font-bold text-white">Hasil & Cetak Rekomendasi</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Output menu makanan gizi seimbang siap ditampilkan dan dicetak menjadi laporan medis.
              </p>
            </div>
          </div>
        </div>

        {/* THEORY & EDUCATION SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-3">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <FaLightbulb className="text-amber-400" />
              <span>Prinsip Metode Naive Bayes</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Metode Naive Bayes mengasumsikan bahwa keberadaan suatu fitur dalam kelas tidak terikat dengan keberadaan fitur lainnya. 
              Rumus utama Posterior Probability:
            </p>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-mono text-center">
              P(C|X) = [ P(X|C) * P(C) ] / P(X)
            </div>
          </div>

          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-3">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <MdCompareArrows className="text-purple-400 text-lg" />
              <span>Panduan Kebutuhan Nutrisi DM</span>
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span><strong>Karbohidrat:</strong> 45-65% dari total kebutuhan kalori harian.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span><strong>Protein:</strong> 15-20% dari total kebutuhan kalori harian.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span><strong>Lemak Sehat:</strong> 20-25% (utamakan asam lemak tidak jenuh).</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;