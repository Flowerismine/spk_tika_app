import API_URL from "../api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaSave, FaArrowLeft, FaSpinner } from "react-icons/fa";

const EditDatasetMakanan = () => {
  const [kriteriaMakanan, setKriteriaMakanan] = useState([]);
  const [nilai, setNilai] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    } else {
      getKriteriaMakanan();
      getDatasetById();
    }
  }, [navigate, id]);

  const getKriteriaMakanan = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/kriteria-makanan`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setKriteriaMakanan(response.data);
    } catch (error) {
      console.error("Error fetching kriteria makanan:", error);
    }
  };

  const getDatasetById = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/dataset-makanan/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNilai(response.data.nilai || {});
    } catch (error) {
      console.error("Error fetching dataset:", error);
      navigate("/dataset-pasien");
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (kriteriaName, value) => {
    setNilai(prev => ({
      ...prev,
      [kriteriaName]: value
    }));
  };

  const updateDataset = async (e) => {
    e.preventDefault();

    // Validasi: pastikan semua kriteria terisi
    const emptyFields = Object.entries(nilai).filter(([key, value]) => !value.trim());
    if (emptyFields.length > 0) {
      alert(`Harap isi semua kriteria: ${emptyFields.map(([key]) => key).join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_URL}/dataset-makanan/${id}`,
        { nilai },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      navigate("/dataset-makanan");
    } catch (error) {
      console.error(
        "Error:",
        error.response ? error.response.data : error.message
      );
      alert(error.response?.data?.msg || "Terjadi kesalahan saat mengupdate dataset");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <FaSpinner className="w-6 h-6 animate-spin" />
          <span className="text-lg">Memuat data...</span>
        </div>
      </div>
    );
  }

  if (kriteriaMakanan.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Kriteria Tidak Ditemukan</h2>
          <p className="text-white/70 mb-6">
            Data kriteria tidak tersedia untuk mengedit dataset ini.
          </p>
          <button
            onClick={() => navigate("/dataset-makanan")}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-300"
          >
            Kembali ke Dataset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.2),transparent_50%)]"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 pt-20 sm:pt-24 md:pt-6 px-4 sm:px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => navigate("/dataset-pasien")}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <FaArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-white">
                      Edit Dataset Makanan
                    </h1>
                  </div>
                  <p className="text-white/70 ml-12">
                    Edit data untuk pasien yang membutuhkan makanan dibolehkan dan tidak boleh
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={updateDataset}>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600/80 to-red-600/80 backdrop-blur-sm p-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">
                  Edit Data Berdasarkan Kriteria
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Update nilai untuk semua kriteria yang tersedia
                </p>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  {/* Dynamic Input Fields berdasarkan kriteria */}
                  {kriteriaMakanan.map((kriteria, index) => (
                    <div key={kriteria.id} className="space-y-2">
                      <label
                        htmlFor={`kriteria-${kriteria.id}`}
                        className="block text-white font-semibold text-lg mb-3"
                      >
                        {kriteria.namaKriteria}{" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        {/* Input Text untuk Nama Makanan dan Kategori Makanan */}
                        {kriteria.namaKriteria === "Nama Makanan" ||
                        kriteria.namaKriteria === "Jumlah Kalori" ||
                        kriteria.namaKriteria === "Kategori Makanan" ? (
                          <input
                            type="text"
                            id={`kriteria-${kriteria.id}`}
                            value={nilai[kriteria.namaKriteria] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                kriteria.namaKriteria,
                                e.target.value
                              )
                            }
                            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 backdrop-blur-sm transition-all duration-300"
                            placeholder={`Masukkan ${kriteria.namaKriteria.toLowerCase()}...`}
                            required
                          />
                        ) : /* Dropdown Boleh/Tidak Boleh untuk Kategori */
                        kriteria.namaKriteria === "Kategori" ? (
                          <select
                            id={`kriteria-${kriteria.id}`}
                            value={nilai[kriteria.namaKriteria] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                kriteria.namaKriteria,
                                e.target.value
                              )
                            }
                            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 backdrop-blur-sm transition-all duration-300 appearance-none cursor-pointer"
                            required
                          >
                            <option
                              value=""
                              className="bg-slate-800 text-white"
                            >
                              Pilih Kategori
                            </option>
                            <option
                              value="Boleh"
                              className="bg-slate-800 text-white"
                            >
                              Boleh
                            </option>
                            <option
                              value="Tidak Boleh"
                              className="bg-slate-800 text-white"
                            >
                              Tidak Boleh
                            </option>
                          </select>
                        ) : (
                          /* Dropdown Ya/Tidak untuk kriteria lainnya */
                          <select
                            id={`kriteria-${kriteria.id}`}
                            value={nilai[kriteria.namaKriteria] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                kriteria.namaKriteria,
                                e.target.value
                              )
                            }
                            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 backdrop-blur-sm transition-all duration-300 appearance-none cursor-pointer"
                            required
                          >
                            <option
                              value=""
                              className="bg-slate-800 text-white"
                            >
                              Pilih Opsi
                            </option>
                            <option
                              value="Ya"
                              className="bg-slate-800 text-white"
                            >
                              Ya
                            </option>
                            <option
                              value="Tidak"
                              className="bg-slate-800 text-white"
                            >
                              Tidak
                            </option>
                          </select>
                        )}

                        {/* Dropdown Arrow Icon untuk select */}
                        {!(
                          kriteria.namaKriteria === "Nama Makanan" ||
                          kriteria.namaKriteria === "Kategori Makanan" ||
                          kriteria.namaKriteria === "Jumlah Kalori" 
                        ) && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-6 pointer-events-none">
                            <svg
                              className="w-5 h-5 text-white/50"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        )}

                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 to-emerald-500/0 opacity-0 hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                  ))}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="group flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
                    >
                      {loading ? (
                        <FaSpinner className="w-5 h-5 animate-spin" />
                      ) : (
                        <FaSave className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                      )}
                      <span>{loading ? "Mengupdate..." : "Update Dataset"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/dataset-makanan")}
                      disabled={loading}
                      className="group flex items-center justify-center gap-3 px-6 py-4 bg-gray-600/50 border border-gray-500/30 text-white rounded-xl hover:bg-gray-600/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 backdrop-blur-sm font-semibold"
                    >
                      <FaArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
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

export default EditDatasetMakanan;