import API_URL from "../api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaSave, FaArrowLeft, FaSpinner } from "react-icons/fa";

const EditDatasetDefisit = () => {
  const [kriteriaDefisit, setKriteriaDefisit] = useState([]);
  const [nilai, setNilai] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => { dispatch(getMe()); }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); }
    else { getKriteriaDefisit(); getDatasetById(); }
  }, [navigate, id]);

  const getKriteriaDefisit = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/kriteria-defisit`,
        { headers: { Authorization: `Bearer ${token}` } });
      setKriteriaDefisit(res.data);
    } catch (e) { console.error(e); }
  };

  const getDatasetById = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/dataset-defisit/${id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setNilai(res.data.nilai || {});
    } catch (e) { console.error(e); navigate("/dataset-pasien"); }
    finally { setLoadingData(false); }
  };

  const handleInputChange = (namaKriteria, value) =>
    setNilai(prev => ({ ...prev, [namaKriteria]: value }));

  const updateDataset = async (e) => {
    e.preventDefault();
    const emptyFields = Object.entries(nilai).filter(([, v]) => !v.trim());
    if (emptyFields.length > 0) {
      alert(`Harap isi semua kriteria: ${emptyFields.map(([k]) => k).join(", ")}`);
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.patch(`${API_URL}/dataset-defisit/${id}`, { nilai },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      navigate("/dataset-pasien");
    } catch (e) {
      alert(e.response?.data?.msg || "Terjadi kesalahan saat mengupdate dataset");
    } finally { setLoading(false); }
  };

  // ── Konfigurasi dropdown terpusat ──────────────────────────────────────────
  const DROPDOWN_CONFIG = {
    "jenis kelamin": { pilihan: ["Pria", "Wanita"],                              hint: "Pilih: Pria atau Wanita" },
    "aktivitas":     { pilihan: ["Ringan", "Sedang", "Berat"],                   hint: "Pilih: Ringan, Sedang, atau Berat" },
    "imt":           { pilihan: ["Underweight", "Kurang", "Normal", "Berlebih", "Overweight"], hint: "Pilih kategori Indeks Massa Tubuh" },
    "usia":          { pilihan: ["Dewasa", "Lansia Awal", "Lansia"],             hint: "Dewasa (30–45 th) · Lansia Awal (46–59 th) · Lansia (≥60 th)" },
    "tingkat stres": { pilihan: ["Rendah", "Sedang", "Tinggi"],                  hint: "Rendah: terkontrol · Sedang: fluktuatif · Tinggi: komplikasi aktif" },
    "main":          { pilihan: ["Ya", "Tidak"],                                 hint: "Pilih: Ya atau Tidak" },
  };

  const getConfig = (namaKriteria) => {
    const lower = namaKriteria.toLowerCase();
    return Object.entries(DROPDOWN_CONFIG).find(([key]) => lower.includes(key))?.[1] || null;
  };

  if (loadingData) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="flex items-center gap-3 text-white">
        <FaSpinner className="w-6 h-6 animate-spin" />
        <span className="text-lg">Memuat data...</span>
      </div>
    </div>
  );

  if (kriteriaDefisit.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-8 max-w-md text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Kriteria Tidak Ditemukan</h2>
        <p className="text-white/70 mb-6">Data kriteria tidak tersedia untuk mengedit dataset ini.</p>
        <button onClick={() => navigate("/dataset-pasien")}
          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300">
          Kembali ke Dataset
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)]"></div>
      </div>
      <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 pt-20 sm:pt-24 md:pt-6 px-4 sm:px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => navigate("/dataset-pasien")}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                  <FaArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-white">Edit Dataset Defisit Kalori</h1>
              </div>
              <p className="text-white/70 ml-12">Perbarui data pasien defisit kalori</p>
            </div>
          </div>

          <form onSubmit={updateDataset}>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600/80 to-red-600/80 backdrop-blur-sm p-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Edit Data Berdasarkan Kriteria</h2>
              </div>
              <div className="p-8">
                <div className="space-y-6">
                  {kriteriaDefisit.map((kriteria) => {
                    const config = getConfig(kriteria.namaKriteria);
                    return (
                      <div key={kriteria.id} className="space-y-2">
                        <label htmlFor={`kriteria-${kriteria.id}`}
                          className="block text-white font-semibold text-lg mb-3">
                          {kriteria.namaKriteria} <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          {config ? (
                            <select id={`kriteria-${kriteria.id}`}
                              value={nilai[kriteria.namaKriteria] || ""}
                              onChange={(e) => handleInputChange(kriteria.namaKriteria, e.target.value)}
                              className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 backdrop-blur-sm transition-all duration-300 appearance-none cursor-pointer"
                              required>
                              <option value="" className="bg-slate-800 text-white">Pilih {kriteria.namaKriteria}</option>
                              {config.pilihan.map((p) => (
                                <option key={p} value={p} className="bg-slate-800 text-white">{p}</option>
                              ))}
                            </select>
                          ) : (
                            <input type="text" id={`kriteria-${kriteria.id}`}
                              value={nilai[kriteria.namaKriteria] || ""}
                              onChange={(e) => handleInputChange(kriteria.namaKriteria, e.target.value)}
                              className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 backdrop-blur-sm transition-all duration-300"
                              placeholder={`Masukkan nilai untuk ${kriteria.namaKriteria.toLowerCase()}...`}
                              required />
                          )}
                          {config && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-white/60 text-sm mt-2">
                          {config ? config.hint : `Masukkan nilai yang sesuai untuk ${kriteria.namaKriteria.toLowerCase()}`}
                        </p>
                      </div>
                    );
                  })}

                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button type="submit" disabled={loading}
                      className="group flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold">
                      {loading ? <FaSpinner className="w-5 h-5 animate-spin" /> : <FaSave className="w-5 h-5" />}
                      <span>{loading ? "Mengupdate..." : "Update Dataset"}</span>
                    </button>
                    <button type="button" onClick={() => navigate("/dataset-pasien")} disabled={loading}
                      className="group flex items-center justify-center gap-3 px-6 py-4 bg-gray-600/50 border border-gray-500/30 text-white rounded-xl hover:bg-gray-600/70 disabled:opacity-50 transition-all duration-300 backdrop-blur-sm font-semibold">
                      <FaArrowLeft className="w-5 h-5" />
                      <span>Kembali</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditDatasetDefisit;
