import API_URL from "../api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaTable, FaCheckCircle, FaExclamationTriangle, FaPrint, FaFilePdf, FaFileExcel } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const HasilAkhirPasien = () => {
  const [hasilAkhirPasien, setHasilAkhirPasien] = useState([]);
  const [makanan, setMakanan] = useState([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getHasilAkhirPasien();
      getMakanan();
    } else {
      navigate("/");
    }
  }, [navigate]);

  const getHasilAkhirPasien = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/hasil-akhir-pasien`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setHasilAkhirPasien(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getMakanan = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/dataset-makanan`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMakanan(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Function untuk mendapatkan makanan secara teratur dan konsisten berdasarkan kategori spesifik
  const getDeterministicByCategory = (foods, categoryName, count) => {
    const filtered = foods.filter(food => {
      const kategori = food.nilai?.["Kategori Makanan"];
      return kategori && kategori.toLowerCase().includes(categoryName.toLowerCase());
    });
    return filtered.slice(0, count);
  };

  const getRekomendasiMakanan = (kategoriPasien) => {
    let result = [];
    if (!makanan || makanan.length === 0) return [];
    
    const katLower = (kategoriPasien || "").toLowerCase();
    const isDefisit = katLower.includes("defisit");
    const isSurplus = katLower.includes("surplus");

    if (isSurplus) {
      const kaloriTinggi = makanan.filter((item) => item.nilai?.["Kalori Tinggi"] === "Ya");
      const kaloriRendah = makanan.filter((item) => item.nilai?.["Kalori Tinggi"] === "Tidak");
      
      const karboTinggi = getDeterministicByCategory(kaloriTinggi, "karbohidrat", 2);
      const karboRendah = getDeterministicByCategory(kaloriRendah, "karbohidrat", 1);
      const proteinTinggi = getDeterministicByCategory(kaloriTinggi, "protein", 3);
      const seratTinggi = getDeterministicByCategory(kaloriTinggi, "serat", 1);
      const seratRendah = getDeterministicByCategory(kaloriRendah, "serat", 1);
      const cemilanTinggi = getDeterministicByCategory(kaloriTinggi, "camilan", 1);
      const cemilanRendah = getDeterministicByCategory(kaloriRendah, "camilan", 1);
      
      result = [
        ...karboTinggi,
        ...karboRendah,
        ...proteinTinggi,
        ...seratTinggi,
        ...seratRendah,
        ...cemilanTinggi,
        ...cemilanRendah
      ];
      
      const usedNames = result.map(item => item.nilai?.["Nama Makanan"]);
      if (result.length < 10) {
        const remaining = makanan.filter(item => !usedNames.includes(item.nilai?.["Nama Makanan"]));
        result = [...result, ...remaining.slice(0, 10 - result.length)];
      }
    } else if (isDefisit) {
      const kaloriRendah = makanan.filter((item) => item.nilai?.["Kalori Tinggi"] === "Tidak");
      const karbo = getDeterministicByCategory(kaloriRendah, "karbohidrat", 3);
      const protein = getDeterministicByCategory(kaloriRendah, "protein", 3);
      const serat = getDeterministicByCategory(kaloriRendah, "serat", 2);
      const cemilan = getDeterministicByCategory(kaloriRendah, "camilan", 2);
      
      result = [...karbo, ...protein, ...serat, ...cemilan];
      
      if (result.length < 10) {
        const remaining = 10 - result.length;
        const usedNames = result.map(item => item.nilai?.["Nama Makanan"]);
        const additionalLow = kaloriRendah
          .filter(item => !usedNames.includes(item.nilai?.["Nama Makanan"]))
          .slice(0, remaining);
        result = [...result, ...additionalLow];
      }
    } else {
      const kaloriTinggi = makanan.filter((item) => item.nilai?.["Kalori Tinggi"] === "Ya");
      const kaloriRendah = makanan.filter((item) => item.nilai?.["Kalori Tinggi"] === "Tidak");
      
      const karboTinggi = getDeterministicByCategory(kaloriTinggi, "karbohidrat", 2);
      const karboRendah = getDeterministicByCategory(kaloriRendah, "karbohidrat", 1);
      const proteinTinggi = getDeterministicByCategory(kaloriTinggi, "protein", 2);
      const proteinRendah = getDeterministicByCategory(kaloriRendah, "protein", 2);
      const seratTinggi = getDeterministicByCategory(kaloriTinggi, "serat", 1);
      const seratRendah = getDeterministicByCategory(kaloriRendah, "serat", 1);
      const cemilanRendah = getDeterministicByCategory(kaloriRendah, "camilan", 1);
      
      result = [...karboTinggi, ...karboRendah, ...proteinTinggi, ...proteinRendah, ...seratTinggi, ...seratRendah, ...cemilanRendah];
      
      const usedNames = result.map(item => item.nilai?.["Nama Makanan"]);
      if (result.length < 10) {
        const remaining = makanan.filter(item => !usedNames.includes(item.nilai?.["Nama Makanan"]));
        result = [...result, ...remaining.slice(0, 10 - result.length)];
      }
    }
    
    return result.filter(item => item && item.nilai).slice(0, 10);
  };

  const exportPDF = () => {
    if (hasilAkhirPasien.length === 0) return alert("Tidak ada data untuk diunduh.");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN HASIL AKHIR KLASIFIKASI PASIEN & REKOMENDASI GIZI", pageW / 2, 14, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")} | Total Data: ${hasilAkhirPasien.length} Pasien`, pageW / 2, 20, { align: "center" });

    const rows = hasilAkhirPasien.map((hasil, idx) => {
      const rekMakanan = getRekomendasiMakanan(hasil.kategori);
      const namaMakananList = rekMakanan.map(m => m.nilai?.["Nama Makanan"]).filter(Boolean).join(", ") || "-";
      return [
        idx + 1,
        hasil.namaPasien,
        hasil.kategori || "-",
        hasil.metadata?.rekomendasiGizi || "-",
        namaMakananList
      ];
    });

    autoTable(doc, {
      startY: 25,
      head: [["No", "Nama Pasien", "Kategori Kalori", "Rekomendasi Gizi", "Daftar Makanan Direkomendasikan"]],
      body: rows,
      headStyles: { fillColor: [147, 51, 234], textColor: 255, fontSize: 9, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 45 },
        2: { cellWidth: 35 },
        3: { cellWidth: 65 },
        4: { cellWidth: 115 },
      },
      margin: { left: 10, right: 10 },
    });

    doc.save(`Hasil_Akhir_Pasien_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportExcel = () => {
    if (hasilAkhirPasien.length === 0) return alert("Tidak ada data untuk diunduh.");
    const exportData = hasilAkhirPasien.map((hasil, idx) => {
      const rekMakanan = getRekomendasiMakanan(hasil.kategori);
      const namaMakananList = rekMakanan.map(m => m.nilai?.["Nama Makanan"]).filter(Boolean).join(", ") || "-";
      return {
        "No": idx + 1,
        "Nama Pasien": hasil.namaPasien,
        "Kategori Kalori": hasil.kategori || "-",
        "Status Prediksi Defisit": hasil.metadata?.hasilDefisit || "-",
        "Status Prediksi Surplus": hasil.metadata?.hasilSurplus || "-",
        "Rekomendasi Gizi": hasil.metadata?.rekomendasiGizi || "-",
        "Rekomendasi Makanan": namaMakananList
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hasil Akhir Pasien");
    XLSX.writeFile(wb, `Hasil_Akhir_Pasien_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
      <div className="hidden md:block absolute top-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="hidden md:block absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Main Content */}
      <div className="relative z-10 pt-20 sm:pt-24 md:pt-6 px-4 sm:px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Hasil Akhir Klasifikasi Pasien */}
          <div className="mb-6">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600/80 via-pink-600/80 to-rose-600/80 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">
                    <FaTable className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                      Hasil Akhir Klasifikasi Kalori
                    </h2>
                    <p className="text-sm sm:text-base text-white/80">
                      Perbandingan hasil prediksi defisit dan surplus
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={exportPDF}
                    className="flex items-center gap-2 px-3 py-2 bg-rose-500/30 hover:bg-rose-500/50 border border-rose-400/40 rounded-xl text-rose-200 text-sm font-semibold transition"
                  >
                    <FaFilePdf className="w-4 h-4 text-rose-300" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={exportExcel}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400/40 rounded-xl text-emerald-200 text-sm font-semibold transition"
                  >
                    <FaFileExcel className="w-4 h-4 text-emerald-300" />
                    <span>Download Excel</span>
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-white/70 font-semibold text-xs sm:text-sm">
                          Pasien
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
                      {hasilAkhirPasien.map((hasil, index) => (
                        <tr
                          key={index}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-white/90 font-medium text-sm sm:text-base">
                            <div className="break-words">
                              {hasil.namaPasien}
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <span
                              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                                hasil.kategori === "Defisit Kalori"
                                  ? "bg-orange-500/20 text-orange-400 border border-orange-400/30"
                                  : hasil.kategori === "Surplus Kalori"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-400/30"
                                  : "bg-green-500/20 text-green-400 border border-green-400/30"
                              }`}
                            >
                              {hasil.kategori}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                            {hasil.kategori === "Defisit Kalori" ? (
                              <FaExclamationTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 mx-auto" />
                            ) : hasil.kategori === "Surplus Kalori" ? (
                              <FaExclamationTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 mx-auto" />
                            ) : (
                              <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {hasilAkhirPasien.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                      <FaTable className="w-8 h-8 sm:w-12 sm:h-12 text-white/50" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white/70 mb-2">
                      Belum Ada Data
                    </h3>
                    <p className="text-sm sm:text-base text-white/50">
                      Hasil klasifikasi pasien belum tersedia. Silakan lakukan
                      perhitungan terlebih dahulu.
                    </p>
                  </div>
                )}

                {/* Summary Statistics */}
                {hasilAkhirPasien.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-3 sm:p-4">
                      <p className="text-orange-400 text-sm">Total Defisit</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">
                        {
                          hasilAkhirPasien.filter(
                            (h) => h.kategori === "Defisit Kalori"
                          ).length
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-white/60 mt-1">
                        {hasilAkhirPasien.length > 0
                          ? `${(
                              (hasilAkhirPasien.filter(
                                (h) => h.kategori === "Defisit Kalori"
                              ).length /
                                hasilAkhirPasien.length) *
                              100
                            ).toFixed(1)}% dari total`
                          : "0% dari total"}
                      </p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 sm:p-4">
                      <p className="text-blue-400 text-sm">Total Surplus</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">
                        {
                          hasilAkhirPasien.filter(
                            (h) => h.kategori === "Surplus Kalori"
                          ).length
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-white/60 mt-1">
                        {hasilAkhirPasien.length > 0
                          ? `${(
                              (hasilAkhirPasien.filter(
                                (h) => h.kategori === "Surplus Kalori"
                              ).length /
                                hasilAkhirPasien.length) *
                              100
                            ).toFixed(1)}% dari total`
                          : "0% dari total"}
                      </p>
                    </div>
                    <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                      <p className="text-green-400 text-sm">Total Normal</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">
                        {
                          hasilAkhirPasien.filter(
                            (h) => h.kategori === "Kalori Normal"
                          ).length
                        }
                      </p>
                      <p className="text-xs sm:text-sm text-white/60 mt-1">
                        {hasilAkhirPasien.length > 0
                          ? `${(
                              (hasilAkhirPasien.filter(
                                (h) => h.kategori === "Kalori Normal"
                              ).length /
                                hasilAkhirPasien.length) *
                              100
                            ).toFixed(1)}% dari total`
                          : "0% dari total"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Distribution Chart Visual */}
                {hasilAkhirPasien.length > 0 && (
                  <div className="mt-6 bg-white/5 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div>
                        <p className="text-white/70 text-sm">
                          Total Pasien Diklasifikasi
                        </p>
                        <p className="text-lg sm:text-xl font-semibold text-white">
                          {hasilAkhirPasien.length} pasien
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:flex sm:gap-4 gap-3 text-center">
                        <div>
                          <p className="text-orange-400 text-xs sm:text-sm">
                            Defisit
                          </p>
                          <p className="text-sm sm:text-base font-semibold text-white">
                            {
                              hasilAkhirPasien.filter(
                                (h) => h.kategori === "Defisit Kalori"
                              ).length
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-400 text-xs sm:text-sm">
                            Surplus
                          </p>
                          <p className="text-sm sm:text-base font-semibold text-white">
                            {
                              hasilAkhirPasien.filter(
                                (h) => h.kategori === "Surplus Kalori"
                              ).length
                            }
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-green-400 text-xs sm:text-sm">
                            Normal
                          </p>
                          <p className="text-sm sm:text-base font-semibold text-white">
                            {
                              hasilAkhirPasien.filter(
                                (h) => h.kategori === "Kalori Normal"
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Health Insights */}
                {hasilAkhirPasien.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 gap-4">
                    {/* Health Status Overview */}
                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 border-l-4 border-purple-500">
                      <h4 className="text-white font-semibold text-sm sm:text-base mb-2">
                        📊 Ringkasan Kesehatan
                      </h4>
                      <div className="space-y-2 text-xs sm:text-sm text-white/70">
                        {hasilAkhirPasien.filter(
                          (h) => h.kategori === "Kalori Normal"
                        ).length >
                        hasilAkhirPasien.length * 0.6 ? (
                          <p>
                            ✅{" "}
                            <span className="text-green-400">
                              Mayoritas pasien
                            </span>{" "}
                            memiliki kebutuhan kalori yang normal
                          </p>
                        ) : (
                          <p>
                            ⚠️{" "}
                            <span className="text-yellow-400">
                              Perlu perhatian:
                            </span>{" "}
                            Banyak pasien membutuhkan penyesuaian kalori
                          </p>
                        )}

                        {hasilAkhirPasien.filter(
                          (h) => h.kategori === "Defisit Kalori"
                        ).length > 0 && (
                          <p>
                            🔥{" "}
                            <span className="text-orange-400">
                              {
                                hasilAkhirPasien.filter(
                                  (h) => h.kategori === "Defisit Kalori"
                                ).length
                              }{" "}
                              pasien
                            </span>{" "}
                            membutuhkan pengurangan asupan kalori (Defisit)
                          </p>
                        )}

                        {hasilAkhirPasien.filter(
                          (h) => h.kategori === "Surplus Kalori"
                        ).length > 0 && (
                          <p>
                            📈{" "}
                            <span className="text-blue-400">
                              {
                                hasilAkhirPasien.filter(
                                  (h) => h.kategori === "Surplus Kalori"
                                ).length
                              }{" "}
                              pasien
                            </span>{" "}
                            membutuhkan penambahan asupan kalori bergizi (Surplus)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Saran Makanan Per Pasien - Untuk semua kategori */}
                    {hasilAkhirPasien.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-white font-semibold text-base sm:text-lg">
                          🍽️ Saran Makanan Per Pasien
                        </h4>
                        
                        {hasilAkhirPasien.map((pasien, index) => {
                          const rekomendasiMakanan = getRekomendasiMakanan(pasien.kategori);
                          
                          return (
                            <div
                              key={index}
                              className={`bg-white/5 rounded-lg p-4 border-l-4 ${
                                pasien.kategori === "Surplus Kalori"
                                  ? "border-blue-500"
                                  : pasien.kategori === "Defisit Kalori"
                                  ? "border-orange-500"
                                  : "border-green-500"
                              }`}
                            >
                              {/* Header Pasien */}
                              <div className="mb-4 flex items-start justify-between">
                                <div>
                                  <h5 className="text-white font-semibold text-base mb-2">
                                    {pasien.namaPasien}
                                  </h5>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        pasien.kategori === "Surplus Kalori"
                                          ? "bg-blue-500/20 text-blue-400"
                                          : pasien.kategori === "Defisit Kalori"
                                          ? "bg-orange-500/20 text-orange-400"
                                          : "bg-green-500/20 text-green-400"
                                      }`}
                                    >
                                      {pasien.kategori}
                                    </span>
                                    <span className="text-white/60 text-xs">
                                      {pasien.kategori === "Surplus Kalori"
                                        ? "🔼 Tambah Kalori"
                                        : pasien.kategori === "Defisit Kalori"
                                        ? "🔽 Kurangi Kalori"
                                        : "⚖️ Pertahankan"}
                                    </span>
                                  </div>
                                </div>

                                {/* Tombol Cetak di sebelah kanan header pasien */}
                                <div className="ml-4">
                                  <button
                                    onClick={() => {
                                      const rekomendasiMakanan = getRekomendasiMakanan(pasien.kategori);
                                      navigate(`/cetak/${pasien.id}`, {
                                        state: {
                                          rekomendasiMakanan: rekomendasiMakanan.map(item => ({
                                            namaMakanan: item.nilai["Nama Makanan"],
                                            kategori: item.nilai["Kategori Makanan"],
                                            kalori: item.nilai["Kalori Tinggi"] === "Ya" ? "Tinggi" : "Rendah",
                                            jumlahKalori: item.nilai["Jumlah Kalori"]
                                          }))
                                        }
                                      });
                                    }}
                                    className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm sm:text-base font-semibold rounded-lg shadow-md ring-1 ring-white/10 transition-transform transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    aria-label={`Cetak laporan ${pasien.namaPasien}`}
                                  >
                                    <FaPrint className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="leading-none">Cetak</span>
                                  </button>
                                </div>
                              </div>

                              {/* Rekomendasi Makanan */}
                              {rekomendasiMakanan.length > 0 ? (
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-white/70 text-sm font-medium">
                                      Rekomendasi Makanan (10 Menu):
                                    </p>
                                    {/* Summary Counter */}
                                    <div className="flex gap-2">
                                      <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full font-semibold">
                                        Tinggi: {rekomendasiMakanan.filter(item => item.nilai["Kalori Tinggi"] === "Ya").length}
                                      </span>
                                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-semibold">
                                        Rendah: {rekomendasiMakanan.filter(item => item.nilai["Kalori Tinggi"] === "Tidak").length}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Group makanan by kategori */}
                                  {(() => {
                                    const groupedByCategory = {
                                      karbohidrat: [],
                                      protein: [],
                                      serat: [],
                                      camilan: [],
                                      lainnya: []
                                    };

                                    rekomendasiMakanan.forEach(item => {
                                      const kategori = item.nilai["Kategori Makanan"]?.toLowerCase() || "";
                                      if (kategori.includes("karbohidrat")) {
                                        groupedByCategory.karbohidrat.push(item);
                                      } else if (kategori.includes("protein")) {
                                        groupedByCategory.protein.push(item);
                                      } else if (kategori.includes("serat") || kategori.includes("buah") || kategori.includes("sayur")) {
                                        groupedByCategory.serat.push(item);
                                      } else if (kategori.includes("camilan") || kategori.includes("minuman") || kategori.includes("snack")) {
                                        groupedByCategory.camilan.push(item);
                                      } else {
                                        groupedByCategory.lainnya.push(item);
                                      }
                                    });

                                    return (
                                      <div className="space-y-4">
                                        {/* Karbohidrat */}
                                        {groupedByCategory.karbohidrat.length > 0 && (
                                          <div>
                                            <h6 className="text-yellow-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                              🍚 Karbohidrat ({groupedByCategory.karbohidrat.length})
                                            </h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {groupedByCategory.karbohidrat.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all border border-yellow-500/20"
                                                >
                                                  <div className="flex justify-between items-start gap-2 mb-2">
                                                    <p className="text-white text-sm font-medium flex-1">
                                                      {item.nilai["Nama Makanan"]}
                                                    </p>
                                                    <span
                                                      className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                                                        item.nilai["Kalori Tinggi"] === "Ya"
                                                          ? "bg-red-500/20 text-red-400"
                                                          : "bg-green-500/20 text-green-400"
                                                      }`}
                                                    >
                                                      {item.nilai["Kalori Tinggi"] === "Ya" ? "Tinggi" : "Rendah"}
                                                    </span>
                                                  </div>
                                                  
                                                  <p className="text-white/50 text-xs mb-2">
                                                    {item.nilai["Kategori Makanan"]}
                                                  </p>

                                                  {/* Rekomendasi Konsumsi */}
                                                  {pasien.kategori === "Surplus Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Defisit Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Kalori Normal" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-yellow-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Sedang
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Badge Nutrisi */}
                                                  <div className="flex flex-wrap gap-1">
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                      {item.nilai["Jumlah Kalori"]} kkal
                                                    </span>
                                                    {item.nilai["Protein Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                        Protein
                                                      </span>
                                                    )}
                                                    {item.nilai["Karbo Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                                        Karbo
                                                      </span>
                                                    )}
                                                    {item.nilai["Lemak Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                                                        Lemak
                                                      </span>
                                                    )}
                                                    {item.nilai["IG Tinggi"] === "Tidak" && (
                                                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                                        IG Rendah
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Protein */}
                                        {groupedByCategory.protein.length > 0 && (
                                          <div>
                                            <h6 className="text-purple-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                              🥩 Protein ({groupedByCategory.protein.length})
                                            </h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {groupedByCategory.protein.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all border border-purple-500/20"
                                                >
                                                  <div className="flex justify-between items-start gap-2 mb-2">
                                                    <p className="text-white text-sm font-medium flex-1">
                                                      {item.nilai["Nama Makanan"]}
                                                    </p>
                                                    <span
                                                      className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                                                        item.nilai["Kalori Tinggi"] === "Ya"
                                                          ? "bg-red-500/20 text-red-400"
                                                          : "bg-green-500/20 text-green-400"
                                                      }`}
                                                    >
                                                      {item.nilai["Kalori Tinggi"] === "Ya" ? "Tinggi" : "Rendah"}
                                                    </span>
                                                  </div>
                                                  
                                                  <p className="text-white/50 text-xs mb-2">
                                                    {item.nilai["Kategori Makanan"]}
                                                  </p>

                                                  {/* Rekomendasi Konsumsi */}
                                                  {pasien.kategori === "Surplus Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Defisit Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Kalori Normal" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-yellow-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Sedang
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Badge Nutrisi */}
                                                  <div className="flex flex-wrap gap-1">
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                      {item.nilai["Jumlah Kalori"]} kkal
                                                    </span>
                                                    {item.nilai["Protein Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                        Protein
                                                      </span>
                                                    )}
                                                    {item.nilai["Karbo Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                                        Karbo
                                                      </span>
                                                    )}
                                                    {item.nilai["Lemak Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                                                        Lemak
                                                      </span>
                                                    )}
                                                    {item.nilai["IG Tinggi"] === "Tidak" && (
                                                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                                        IG Rendah
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Serat / Sayuran & Buah */}
                                        {groupedByCategory.serat.length > 0 && (
                                          <div>
                                            <h6 className="text-green-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                              🥗 Serat / Sayur & Buah ({groupedByCategory.serat.length})
                                            </h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {groupedByCategory.serat.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all border border-green-500/20"
                                                >
                                                  <div className="flex justify-between items-start gap-2 mb-2">
                                                    <p className="text-white text-sm font-medium flex-1">
                                                      {item.nilai["Nama Makanan"]}
                                                    </p>
                                                    <span
                                                      className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                                                        item.nilai["Kalori Tinggi"] === "Ya"
                                                          ? "bg-red-500/20 text-red-400"
                                                          : "bg-green-500/20 text-green-400"
                                                      }`}
                                                    >
                                                      {item.nilai["Kalori Tinggi"] === "Ya" ? "Tinggi" : "Rendah"}
                                                    </span>
                                                  </div>
                                                  
                                                  <p className="text-white/50 text-xs mb-2">
                                                    {item.nilai["Kategori Makanan"]}
                                                  </p>

                                                  {/* Rekomendasi Konsumsi */}
                                                  {pasien.kategori === "Surplus Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}
                                                  
                                                  {pasien.kategori === "Defisit Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Kalori Normal" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-yellow-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Sedang
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Badge Nutrisi */}
                                                  <div className="flex flex-wrap gap-1">
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                      {item.nilai["Jumlah Kalori"]} kkal
                                                    </span>
                                                    {item.nilai["Protein Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                        Protein
                                                      </span>
                                                    )}
                                                    {item.nilai["Karbo Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                                        Karbo
                                                      </span>
                                                    )}
                                                    {item.nilai["Lemak Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                                                        Lemak
                                                      </span>
                                                    )}
                                                    {item.nilai["IG Tinggi"] === "Tidak" && (
                                                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                                        IG Rendah
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Camilan */}
                                        {groupedByCategory.camilan.length > 0 && (
                                          <div>
                                            <h6 className="text-orange-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                              🍪 Camilan ({groupedByCategory.camilan.length})
                                            </h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {groupedByCategory.camilan.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all border border-orange-500/20"
                                                >
                                                  <div className="flex justify-between items-start gap-2 mb-2">
                                                    <p className="text-white text-sm font-medium flex-1">
                                                      {item.nilai["Nama Makanan"]}
                                                    </p>
                                                    <span
                                                      className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                                                        item.nilai["Kalori Tinggi"] === "Ya"
                                                          ? "bg-red-500/20 text-red-400"
                                                          : "bg-green-500/20 text-green-400"
                                                      }`}
                                                    >
                                                      {item.nilai["Kalori Tinggi"] === "Ya" ? "Tinggi" : "Rendah"}
                                                    </span>
                                                  </div>
                                                  
                                                  <p className="text-white/50 text-xs mb-2">
                                                    {item.nilai["Kategori Makanan"]}
                                                  </p>

                                                  {/* Rekomendasi Konsumsi */}
                                                  {pasien.kategori === "Surplus Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}
                                                  
                                                  {pasien.kategori === "Defisit Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Kalori Normal" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-yellow-400 text-xs mb-2 font-medium">
                                                          ⚠️ Konsumsi Secukupnya / Porsi Sedang
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Badge Nutrisi */}
                                                  <div className="flex flex-wrap gap-1">
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                      {item.nilai["Jumlah Kalori"]} kkal
                                                    </span>
                                                    {item.nilai["Protein Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                        Protein
                                                      </span>
                                                    )}
                                                    {item.nilai["Karbo Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                                        Karbo
                                                      </span>
                                                    )}
                                                    {item.nilai["Lemak Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                                                        Lemak
                                                      </span>
                                                    )}
                                                    {item.nilai["IG Tinggi"] === "Tidak" && (
                                                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                                        IG Rendah
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Lainnya (jika ada) */}
                                        {groupedByCategory.lainnya.length > 0 && (
                                          <div>
                                            <h6 className="text-gray-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                              🍽️ Lainnya ({groupedByCategory.lainnya.length})
                                            </h6>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {groupedByCategory.lainnya.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all"
                                                >
                                                  <div className="flex justify-between items-start gap-2 mb-2">
                                                    <p className="text-white text-sm font-medium flex-1">
                                                      {item.nilai["Nama Makanan"]}
                                                    </p>
                                                    <span
                                                      className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${
                                                        item.nilai["Kalori Tinggi"] === "Ya"
                                                          ? "bg-red-500/20 text-red-400"
                                                          : "bg-green-500/20 text-green-400"
                                                      }`}
                                                    >
                                                      {item.nilai["Kalori Tinggi"] === "Ya" ? "Tinggi" : "Rendah"}
                                                    </span>
                                                  </div>
                                                  
                                                  <p className="text-white/50 text-xs mb-2">
                                                    {item.nilai["Kategori Makanan"]}
                                                  </p>

                                                  {/* Rekomendasi Konsumsi */}
                                                  {pasien.kategori === "Surplus Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}
                                                  
                                                  {pasien.kategori === "Defisit Kalori" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-red-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Rendah
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {pasien.kategori === "Kalori Normal" && (
                                                    <>
                                                      {item.nilai["Kalori Tinggi"] === "Ya" && (
                                                        <p className="text-yellow-400 text-xs mb-2 font-medium">
                                                          ⚠️ Tidak Disarankan / Porsi Sedang
                                                        </p>
                                                      )}
                                                    </>
                                                  )}

                                                  {/* Badge Nutrisi */}
                                                  <div className="flex flex-wrap gap-1">
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                      {item.nilai["Jumlah Kalori"]} kkal
                                                    </span>
                                                    {item.nilai["Protein Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                        Protein
                                                      </span>
                                                    )}
                                                    {item.nilai["Karbo Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                                        Karbo
                                                      </span>
                                                    )}
                                                    {item.nilai["Lemak Tinggi"] === "Ya" && (
                                                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                                                        Lemak
                                                      </span>
                                                    )}
                                                    {item.nilai["IG Tinggi"] === "Tidak" && (
                                                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                                        IG Rendah
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Catatan */}
                                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                                    <p className="text-white/60 text-xs leading-relaxed">
                                      💡 {pasien.kategori === "Surplus Kalori"
                                        ? "Menu terdiri dari 6 makanan tinggi kalori dan 3 makanan rendah kalori (total 10 menu) yang dipilih dari berbagai kategori untuk meningkatkan asupan kalori secara optimal."
                                        : pasien.kategori === "Defisit Kalori"
                                        ? "Menu terdiri dari 10 makanan rendah kalori yang dipilih dari berbagai kategori untuk membantu mengurangi asupan kalori harian secara efektif."
                                        : "Menu terdiri dari 5 makanan tinggi kalori dan 5 makanan rendah kalori (total 10 menu) yang seimbang dari berbagai kategori untuk menjaga asupan kalori tetap normal."}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-white/50 text-sm italic">
                                  Tidak ada rekomendasi makanan tersedia untuk kategori ini.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
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

export default HasilAkhirPasien;