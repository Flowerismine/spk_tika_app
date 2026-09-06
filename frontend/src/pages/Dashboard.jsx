import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { MdMenuBook, MdCompareArrows, MdTrendingUp, MdAssessment } from "react-icons/md";
import { FaBrain, FaChartLine, FaDatabase } from "react-icons/fa6";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      console.log("berhasil");
    } else {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.2),transparent_50%)]"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>

      {/* Main Content */}
      <div className="relative z-10 p-6">
        {/* Content */}
        <div className="max-w-7xl mx-auto">
          {/* Naive Bayes Introduction Section */}
          <div className="mb-12 mt-16">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-indigo-600/80 via-purple-600/80 to-blue-600/80 backdrop-blur-sm py-6 px-4 sm:py-8 sm:px-8">
                <div className="absolute inset-0 bg-white/5"></div>
                <div className="relative">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <FaBrain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-white text-center mb-2">
                    Welcome to Naive Bayes Classification System!
                  </h1>
                  <p className="text-white/80 text-center text-base sm:text-lg max-w-full sm:max-w-3xl mx-auto leading-relaxed">
                    Metode Naive Bayes adalah algoritma machine learning yang powerful untuk klasifikasi berdasarkan probabilitas. 
                    Sistem ini membantu mengklasifikasikan data dengan akurasi tinggi menggunakan teorema Bayes dengan asumsi independensi antar fitur.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Naive Bayes Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Prinsip Dasar Naive Bayes */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="relative bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm p-6 border-b border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaBrain className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Prinsip Dasar Naive Bayes</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-white/80 leading-relaxed mb-4">
                  Metode Naive Bayes berfokus pada klasifikasi data berdasarkan probabilitas dengan menggunakan teorema Bayes. 
                  Berikut adalah langkah-langkah dasar dalam metode Naive Bayes:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="text-white font-medium">Pengumpulan Data Training</div>
                      <div className="text-white/70 text-sm">Identifikasi fitur-fitur yang relevan dan kelas target yang akan diprediksi</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="text-white font-medium">Perhitungan Probabilitas</div>
                      <div className="text-white/70 text-sm">Hitung probabilitas prior dan likelihood untuk setiap fitur dan kelas</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="text-white font-medium">Klasifikasi Prediksi</div>
                      <div className="text-white/70 text-sm">Gunakan teorema Bayes untuk memprediksi kelas dari data baru</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kelebihan dan Kekurangan Naive Bayes */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="relative bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm p-6 border-b border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <MdCompareArrows className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Kelebihan dan Kekurangan</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Kelebihan:
                  </h4>
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      <span>Mudah diimplementasikan dan dipahami</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      <span>Performa baik pada dataset kecil</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      <span>Cepat dalam training dan prediksi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      <span>Tidak memerlukan parameter tuning yang kompleks</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-red-300 font-semibold mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    Kekurangan:
                  </h4>
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>Asumsi independensi fitur yang kuat</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>Bergantung pada kualitas data training</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      <span>Sensitif terhadap fitur yang tidak relevan</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;