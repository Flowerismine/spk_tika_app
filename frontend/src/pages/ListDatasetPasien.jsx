import API_URL from "../api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const ListDatasetPasien = () => {
  const [kriteriaDefisit, setKriteriaDefisit] = useState([]);
  const [kriteriaSurplus, setKriteriaSurplus] = useState([]);
  const [datasetDefisit, setDatasetDefisit] = useState([]);
  const [datasetSurplus, setDatasetSurplus] = useState([]);

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
      getDatasetDefisit();
      getDatasetSurplus();
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
      console.error("Error fetching kriteria defisit:", error);
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
      console.error("Error fetching kriteria surplus:", error);
    }
  };

  const getDatasetDefisit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/dataset-defisit`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDatasetDefisit(response.data);
    } catch (error) {
      console.error("Error fetching dataset defisit:", error);
    }
  };

  const getDatasetSurplus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/dataset-surplus`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDatasetSurplus(response.data);
    } catch (error) {
      console.error("Error fetching dataset surplus:", error);
    }
  };

  const deleteDatasetDefisit = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/dataset-defisit/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      getDatasetDefisit(); // Refresh data
    } catch (error) {
      console.error("Error deleting dataset defisit:", error);
    }
  };

  const deleteDatasetSurplus = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/dataset-surplus/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      getDatasetSurplus(); // Refresh data
    } catch (error) {
      console.error("Error deleting dataset surplus:", error);
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
          {/* Tabel Dataset Defisit Kalori */}
          <div className="mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600/80 to-red-600/80 backdrop-blur-sm p-6 border-b border-white/10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Dataset Defisit Kalori
                    </h2>
                    <p className="text-white/80">
                      Data Dataset untuk pasien yang membutuhkan pengurangan
                      kalori
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/add-dataset-defisit")}
                    className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <FaPlus className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span className="font-medium">Tambah Dataset</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                        No
                      </th>
                      {kriteriaDefisit.map((k) => (
                        <th
                          key={k.id}
                          className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider"
                        >
                          {k.namaKriteria}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {datasetDefisit.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-white font-medium">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        {kriteriaDefisit.map((kriteria) => (
                          <td
                            key={kriteria.id}
                            className="px-6 py-4 whitespace-nowrap text-white/80"
                          >
                            {item.nilai
                              ? item.nilai[kriteria.namaKriteria] || "-"
                              : "-"}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                navigate(`/edit-dataset-defisit/${item.id}`)
                              }
                              className="p-2 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/20 rounded-lg transition-all duration-200"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteDatasetDefisit(item.id)}
                              className="p-2 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all duration-200"
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

          {/* Tabel Dataset Surplus Kalori */}
          <div className="mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 backdrop-blur-sm p-6 border-b border-white/10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Dataset Surplus Kalori
                    </h2>
                    <p className="text-white/80">
                      Data Dataset untuk pasien yang membutuhkan penambahan
                      kalori
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/add-dataset-surplus")}
                    className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <FaPlus className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span className="font-medium">Tambah Dataset</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                        No
                      </th>
                      {kriteriaSurplus.map((k) => (
                        <th
                          key={k.id}
                          className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider"
                        >
                          {k.namaKriteria}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {datasetSurplus.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-white font-medium">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        {kriteriaSurplus.map((kriteria) => (
                          <td
                            key={kriteria.id}
                            className="px-6 py-4 whitespace-nowrap text-white/80"
                          >
                            {item.nilai
                              ? item.nilai[kriteria.namaKriteria] || "-"
                              : "-"}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                navigate(`/edit-dataset-surplus/${item.id}`)
                              }
                              className="p-2 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/20 rounded-lg transition-all duration-200"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteDatasetSurplus(item.id)}
                              className="p-2 text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all duration-200"
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

export default ListDatasetPasien;
