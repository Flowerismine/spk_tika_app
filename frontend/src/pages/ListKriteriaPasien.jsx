import API_URL from "../api";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const ListKriteriaPasien = () => {
  const [kriteriaDefisit, setKriteriaDefisit] = useState([]);
  const [kriteriaSurplus, setKriteriaSurplus] = useState([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getKriteriaDefisit();
      getKriteriaSurplus();
    } else {
      navigate("/");
    }
  }, [navigate]);

  const getKriteriaDefisit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/kriteria-defisit`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setKriteriaDefisit(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getKriteriaSurplus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/kriteria-surplus`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setKriteriaSurplus(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleEditDefisit = (id) => {
    navigate(`/edit-kriteria-defisit/${id}`);
  };

  const handleEditSurplus = (id) => {
    navigate(`/edit-kriteria-surplus/${id}`);
  };

  const handleDeleteDefisit = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/kriteria-defisit/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      getKriteriaDefisit();
    } catch (error) {
      console.error("Error deleting data:", error);
    }
  };

  const handleDeleteSurplus = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/kriteria-surplus/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      getKriteriaSurplus();
    } catch (error) {
      console.error("Error deleting data:", error);
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

      {/* Floating Elements - Hidden on mobile for better performance */}
      <div className="hidden md:block absolute top-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="hidden md:block absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Main Content - Added top padding for navbar clearance */}
      <div className="relative z-10 pt-20 sm:pt-24 md:pt-6 px-4 sm:px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Header - Improved mobile spacing */}
          <div className="mb-6 sm:mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                    Kalori Pasien
                  </h1>
                  <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                    Manajemen kriteria untuk klasifikasi kebutuhan kalori
                    berdasarkan kategori defisit dan surplus
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Defisit Kalori - Improved mobile layout */}
          <div className="mb-6 sm:mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600/80 to-red-600/80 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="text-center sm:text-left">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
                      Kriteria Defisit Kalori
                    </h2>
                    <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                      Data kriteria untuk pasien yang membutuhkan pengurangan
                      kalori
                    </p>
                  </div>
                  <div className="flex justify-center sm:justify-start">
                    <button
                      className="group flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                      onClick={() => navigate("/add-kriteria-defisit")}
                    >
                      <FaPlus className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium">Tambah Kriteria</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-white/70 uppercase tracking-wider w-12 sm:w-20">
                        NO
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left sm:text-center text-xs font-bold text-white/70 uppercase tracking-wider">
                        NAMA KRITERIA
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-bold text-white/70 uppercase tracking-wider w-20 sm:w-32">
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {kriteriaDefisit.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-left w-12 sm:w-20">
                          <div className="flex items-center">
                            <span className="text-white font-medium text-sm sm:text-base">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-left text-white/80 text-sm sm:text-base">
                          <div className="break-words">{item.namaKriteria}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap w-20 sm:w-32">
                          <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
                            <button
                              className="p-1.5 sm:p-2 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/20 rounded-lg transition-all duration-200"
                              onClick={() => handleEditDefisit(item.id)}
                            >
                              <FaEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              className="p-1.5 sm:p-2 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                              onClick={() => handleDeleteDefisit(item.id)}
                            >
                              <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tabel Surplus Kalori - Improved mobile layout */}
          <div className="mb-6 sm:mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="text-center sm:text-left">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
                      Kriteria Surplus Kalori
                    </h2>
                    <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                      Data kriteria untuk pasien yang membutuhkan penambahan
                      kalori
                    </p>
                  </div>
                  <div className="flex justify-center sm:justify-start">
                    <button
                      className="group flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                      onClick={() => navigate("/add-kriteria-surplus")}
                    >
                      <FaPlus className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium">Tambah Kriteria</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider w-12 sm:w-20">
                        NO
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left sm:text-center text-xs font-semibold text-white/70 uppercase tracking-wider">
                        NAMA KRITERIA
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-white/70 uppercase tracking-wider w-20 sm:w-32">
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {kriteriaSurplus.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-left w-12 sm:w-20">
                          <div className="flex items-center">
                            <span className="text-white font-medium text-sm sm:text-base">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-left sm:text-center text-white/80 text-sm sm:text-base">
                          <div className="break-words">{item.namaKriteria}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap w-20 sm:w-32">
                          <div className="flex items-center justify-center sm:justify-end space-x-1 sm:space-x-2">
                            <button
                              className="p-1.5 sm:p-2 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/20 rounded-lg transition-all duration-200"
                              onClick={() => handleEditSurplus(item.id)}
                            >
                              <FaEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              className="p-1.5 sm:p-2 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                              onClick={() => handleDeleteSurplus(item.id)}
                            >
                              <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListKriteriaPasien;
