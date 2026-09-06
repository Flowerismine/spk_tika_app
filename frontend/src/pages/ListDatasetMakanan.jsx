import API_URL from "../api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaPlus, FaEdit, FaTrash, FaFilePdf, FaFileExcel } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const ListDatasetMakanan = () => {
  const [kriteriaMakanan, setKriteriaMakanan] = useState([]);
  const [datasetMakanan, setDatasetMakanan] = useState([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getKriteriaMakanan();
      getDatasetMakanan();
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
      console.error("Error fetching kriteria makanan:", error);
    }
  };

  const getDatasetMakanan = async () => {
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
      setDatasetMakanan(response.data);
    } catch (error) {
      console.error("Error fetching dataset makanan:", error);
    }
  };

  const deleteDatasetMakanan = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/dataset-makanan/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      getDatasetMakanan(); // Refresh data
    } catch (error) {
      console.error("Error deleting dataset makanan:", error);
    }
  };

  const exportPDF = () => {
    if (datasetMakanan.length === 0) return alert("Tidak ada data untuk diunduh.");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DATASET KOMPOSISI ZAT GIZI PANGAN & MAKANAN DIABETES MELITUS", pageW / 2, 14, { align: "center" });

    const headers = ["No", ...kriteriaMakanan.map(k => k.namaKriteria)];
    const rows = datasetMakanan.map((item, idx) => [
      idx + 1,
      ...kriteriaMakanan.map(k => item.nilai ? item.nilai[k.namaKriteria] || "-" : "-")
    ]);

    autoTable(doc, {
      startY: 22,
      head: [headers],
      body: rows,
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 9, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 10, right: 10 },
    });

    doc.save(`Dataset_Makanan_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportExcel = () => {
    if (datasetMakanan.length === 0) return alert("Tidak ada data untuk diunduh.");
    const exportData = datasetMakanan.map((item, idx) => {
      const row = { "No": idx + 1 };
      kriteriaMakanan.forEach(k => {
        row[k.namaKriteria] = item.nilai ? item.nilai[k.namaKriteria] || "-" : "-";
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dataset Makanan");
    XLSX.writeFile(wb, `Dataset_Makanan_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
          {/* Tabel Dataset Makanan */}
          <div className="mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600/80 to-red-600/80 backdrop-blur-sm p-6 border-b border-white/10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Dataset Makanan
                    </h2>
                    <p className="text-white/80">
                      Data Dataset untuk makanan yang diperbolehkan dan tidak boleh
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={exportPDF}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-600/80 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                      <FaFilePdf className="w-4 h-4" />
                      PDF
                    </button>
                    <button
                      onClick={exportExcel}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600/80 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                      <FaFileExcel className="w-4 h-4" />
                      Excel
                    </button>
                    <button
                      onClick={() => navigate("/add-dataset-makanan")}
                      className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                    >
                      <FaPlus className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium">Tambah Dataset</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                        No
                      </th>
                      {kriteriaMakanan.map((k) => (
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
                    {datasetMakanan.map((item, index) => (
                      <tr
                        key={item.id}
                        className="hover:bg-white/5 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-white text">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        {kriteriaMakanan.map((kriteria) => (
                          <td
                            key={kriteria.id}
                            className="px-6 py-4 whitespace-nowrap text-white/80 text-xs"
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
                                navigate(`/edit-dataset-makanan/${item.id}`)
                              }
                              className="p-2 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/20 rounded-lg transition-all duration-200"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteDatasetMakanan(item.id)}
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

export default ListDatasetMakanan;
