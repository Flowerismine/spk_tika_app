import API_URL from "../api";
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaSave, FaArrowLeft } from "react-icons/fa";

const EditKriteriaSurplus = () => {
  const [namaKriteria, setNamaKriteria] = useState("");
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getKriteriaSurplusById();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const getKriteriaSurplusById = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/kriteria-surplus/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNamaKriteria(response.data.namaKriteria);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const updateKriteriaSurplus = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("namaKriteria", namaKriteria);

    const jsonData = {};
    formData.forEach((value, key) => {
      jsonData[key] = value;
    });

    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_URL}/kriteria-surplus/${id}`, jsonData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      navigate("/kriteria-pasien");
    } catch (error) {
      console.error("Error updating data:", error);
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
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                      onClick={() => navigate("/kriteria-pasien")}
                    >
                      <FaArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-white">
                      Edit Kriteria Surplus Kalori
                    </h1>
                  </div>
                  <p className="text-white/70 ml-12">
                    Edit kriteria untuk klasifikasi pasien yang membutuhkan
                    penambahan kalori
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={updateKriteriaSurplus}>
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
              <div className="p-8">
                <div className="space-y-6">
                  {/* Input Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="namaKriteria"
                      className="block text-white font-semibold text-lg mb-3"
                    >
                      Nama Kriteria <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="namaKriteria"
                        value={namaKriteria}
                        onChange={(e) => {
                          setNamaKriteria(e.target.value);
                        }}
                        className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 backdrop-blur-sm transition-all duration-300"
                        placeholder="Masukkan nama kriteria surplus kalori..."
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 to-red-500/0 opacity-0 hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                    <p className="text-white/60 text-sm mt-2">
                      Contoh: "Jenis Kelamin, Aktivitas, IMT, Main", dll.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button className="group flex items-center justify-center gap-3 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold">
                      <FaSave className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                      <span>Update Kriteria</span>
                    </button>

                    <button
                      type="button"
                      className="group flex items-center justify-center gap-3 px-4 py-2 bg-gray-600/50 border border-gray-500/30 text-white rounded-xl hover:bg-gray-600/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 backdrop-blur-sm font-semibold"
                      onClick={() => navigate("/kriteria-pasien")}
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

export default EditKriteriaSurplus;
