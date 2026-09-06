import API_URL from "../api";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaTable, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

const HasilAkhirMakanan = () => {
  const [hasilAkhirMakanan, setHasilAkhirMakanan] = useState([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getHasilAkhirMakanan();
    } else {
      navigate("/");
    }
  }, [navigate]);

  const getHasilAkhirMakanan = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/hasil-akhir-makanan`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setHasilAkhirMakanan(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.2),transparent_50%)]"></div>
      </div>

      {/* Floating Elements - Hidden on mobile */}
      <div className="hidden md:block absolute top-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="hidden md:block absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Main Content - Added responsive padding */}
      <div className="relative z-10 pt-20 sm:pt-24 md:pt-6 px-4 sm:px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Hasil Akhir Klasifikasi Makanan - Mobile Responsive */}
          <div className="mb-6">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600/80 via-pink-600/80 to-rose-600/80 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">
                    <FaTable className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                      Hasil Akhir Klasifikasi Makanan
                    </h2>
                    <p className="text-sm sm:text-base text-white/80">
                      Hasil prediksi makanan yang boleh dan tidak boleh
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-white/70 font-semibold text-xs sm:text-sm">
                          Nama Makanan
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-white/70 font-semibold text-xs sm:text-sm">
                          Kategori
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-white/70 font-semibold text-xs sm:text-sm">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {hasilAkhirMakanan.map((hasil, index) => (
                        <tr
                          key={index}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-white/90 font-medium text-sm sm:text-base">
                            <div className="break-words">{hasil.namaMakanan}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span
                              className={`px-1 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                                hasil.kategori === "Boleh"
                                  ? "bg-green-500/20 text-green-400 border border-green-400/30"
                                  : "bg-orange-500/20 text-orange-400 border border-orange-400/30"
                              }`}
                            >
                              {hasil.kategori}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                            {hasil.kategori === "Tidak Boleh" ? (
                              <FaExclamationTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 mx-auto" />
                            ) : (
                              <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State - Show when no data */}
                {hasilAkhirMakanan.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                      <FaTable className="w-8 h-8 sm:w-12 sm:h-12 text-white/50" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white/70 mb-2">
                      Belum Ada Data
                    </h3>
                    <p className="text-sm sm:text-base text-white/50">
                      Hasil klasifikasi makanan belum tersedia. Silakan lakukan perhitungan terlebih dahulu.
                    </p>
                  </div>
                )}

                {/* Summary Statistics - Mobile Stack */}
                {hasilAkhirMakanan.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 sm:p-4">
                      <p className="text-green-400 text-sm">Total Boleh</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">
                        {
                          hasilAkhirMakanan.filter((h) => h.kategori === "Boleh")
                            .length
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-white/60 mt-1">
                        {hasilAkhirMakanan.length > 0 
                          ? `${((hasilAkhirMakanan.filter((h) => h.kategori === "Boleh").length / hasilAkhirMakanan.length) * 100).toFixed(1)}% dari total`
                          : '0% dari total'
                        }
                      </p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-3 sm:p-4">
                      <p className="text-orange-400 text-sm">Total Tidak Boleh</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">
                        {
                          hasilAkhirMakanan.filter(
                            (h) => h.kategori === "Tidak Boleh"
                          ).length
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-white/60 mt-1">
                        {hasilAkhirMakanan.length > 0 
                          ? `${((hasilAkhirMakanan.filter((h) => h.kategori === "Tidak Boleh").length / hasilAkhirMakanan.length) * 100).toFixed(1)}% dari total`
                          : '0% dari total'
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Additional Info - Mobile Responsive */}
                {hasilAkhirMakanan.length > 0 && (
                  <div className="mt-6 bg-white/5 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <div>
                        <p className="text-white/70 text-sm">Total Makanan Diklasifikasi</p>
                        <p className="text-lg sm:text-xl font-semibold text-white">
                          {hasilAkhirMakanan.length} item
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/70 text-sm">Status Terakhir Update</p>
                        <p className="text-sm sm:text-base text-green-400">
                          Data Terbaru
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HasilAkhirMakanan;
