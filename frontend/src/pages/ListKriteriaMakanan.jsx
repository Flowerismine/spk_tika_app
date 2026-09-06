import API_URL from "../api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const ListKriteriaMakanan = () => {
  const [kriteriaMakanan, setKriteriaMakanan] = useState([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getKriteriaMakanan();
    } else {
      navigate("/");
    }
  }, [navigate]);

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
      console.error("Error fetching data:", error);
    }
  };

  const handleEditMakanan = (id) => {
    navigate(`/edit-kriteria-makanan/${id}`);
  };

  const handleDeleteMakanan = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/kriteria-makanan/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      getKriteriaMakanan();
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
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Kriteria Makanan
                  </h1>
                  <p className="text-white/70">
                    Manajemen kriteria untuk klasifikasi makanan
                    berdasarkan kategori boleh dan tidak boleh
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Kriteria Makanan */}
          <div className="mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600/80 to-red-600/80 backdrop-blur-sm p-6 border-b border-white/10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Kriteria Makanan
                    </h2>
                    <p className="text-white/80">
                      Data kriteria untuk makanan yang boleh dan tidak boleh
                    </p>
                  </div>
                  <button
                    className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    onClick={() => navigate("/add-kriteria-makanan")}
                  >
                    <FaPlus className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span className="font-medium">Tambah Kriteria</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white/70 uppercase tracking-wider w-20">
                        No
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-white/70 uppercase tracking-wider">
                        Nama Kriteria
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-white/70 uppercase tracking-wider w-32">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {kriteriaMakanan.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-left w-20">
                          <div className="flex items-center">
                            <span className="text-white font-medium">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left text-white/80">
                          {item.namaKriteria}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap w-32">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              className="p-2 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/20 rounded-lg transition-all duration-200"
                              onClick={() => handleEditMakanan(item.id)}
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                              onClick={() => handleDeleteMakanan(item.id)}
                            >
                              <FaTrash className="w-4 h-4" />
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

export default ListKriteriaMakanan;
