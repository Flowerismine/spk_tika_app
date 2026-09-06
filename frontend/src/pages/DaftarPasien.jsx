import API_URL from "../api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import { FaUsers, FaUserPlus, FaPrint, FaTrash, FaSpinner, FaSearch, FaFilePdf, FaFileExcel } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const DaftarPasien = () => {
  const [pasien, setPasien] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => { dispatch(getMe()); }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
    else loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/hasil-akhir-pasien?tipe=pasien`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPasien(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const hapusPasien = async (id, nama) => {
    if (!window.confirm(`Hapus data pasien "${nama}"?`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/pasien/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadData();
    } catch (e) {
      alert(e.response?.data?.msg || "Gagal menghapus");
    }
  };

  const cetakPasien = (p) => {
    const meta = p.metadata || {};
    const data = {
      namaPasien: p.namaPasien,
      kategori: p.kategori,
      nilai: meta.nilai || {},
      usiaAngka: meta.usia || "",
      beratBadan: meta.bb || "",
      tinggiBadan: meta.tb || "",
      imtAngka: meta.imt || null,
      rekomendasi: meta.rekomendasi || null,
      tanggal: new Date(p.createdAt).toLocaleDateString("id-ID", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      }),
      fromDatabase: true,
      id: p.id,
    };
    localStorage.setItem("cetakPasienData", JSON.stringify(data));
    window.open("/cetak-pasien", "_blank");
  };

  const exportPDF = () => {
    if (pasien.length === 0) return alert("Tidak ada data untuk diunduh.");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN DATA PASIEN & HASIL KLASIFIKASI DIABETES MELITUS", pageW / 2, 14, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")} | Total Pasien: ${pasien.length}`, pageW / 2, 20, { align: "center" });

    const rows = pasien.map((p, i) => [
      i + 1,
      p.namaPasien,
      p.kategori || "-",
      p.metadata?.jenisKelamin || p.metadata?.nilai?.["Jenis Kelamin"] || "-",
      p.metadata?.usia || p.metadata?.usiaAngka || p.metadata?.nilai?.["Usia"] || "-",
      p.metadata?.imt || p.metadata?.imtAngka || p.metadata?.nilai?.["IMT"] || "-",
      p.metadata?.rekomendasiGizi || "-",
      new Date(p.createdAt).toLocaleDateString("id-ID")
    ]);

    autoTable(doc, {
      startY: 25,
      head: [["No", "Nama Pasien", "Kategori Kalori", "JK", "Usia", "IMT", "Rekomendasi Gizi", "Tanggal"]],
      body: rows,
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 9, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 10, right: 10 },
    });

    doc.save(`Laporan_Daftar_Pasien_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportExcel = () => {
    if (pasien.length === 0) return alert("Tidak ada data untuk diunduh.");
    const exportData = pasien.map((p, i) => ({
      "No": i + 1,
      "Nama Pasien": p.namaPasien,
      "Kategori Kalori": p.kategori || "-",
      "Jenis Kelamin": p.metadata?.jenisKelamin || p.metadata?.nilai?.["Jenis Kelamin"] || "-",
      "Usia": p.metadata?.usia || p.metadata?.usiaAngka || p.metadata?.nilai?.["Usia"] || "-",
      "IMT": p.metadata?.imt || p.metadata?.imtAngka || p.metadata?.nilai?.["IMT"] || "-",
      "Hasil Defisit": p.metadata?.hasilDefisit || "-",
      "Hasil Surplus": p.metadata?.hasilSurplus || "-",
      "Rekomendasi Gizi": p.metadata?.rekomendasiGizi || "-",
      "Tanggal": new Date(p.createdAt).toLocaleDateString("id-ID")
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Pasien");
    XLSX.writeFile(wb, `Laporan_Daftar_Pasien_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filtered = pasien.filter(p =>
    p.namaPasien.toLowerCase().includes(search.toLowerCase())
  );

  const isDefisit = (kat) => kat && kat.toLowerCase().includes("defisit");
  const isSurplus = (kat) => kat && kat.toLowerCase().includes("surplus");

  // Statistik
  const stat = {
    total: pasien.length,
    defisit: pasien.filter(p => isDefisit(p.kategori)).length,
    surplus: pasien.filter(p => isSurplus(p.kategori)).length,
    normal:  pasien.filter(p => !isDefisit(p.kategori) && !isSurplus(p.kategori)).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 pt-20 sm:pt-24 md:pt-6 px-4 sm:px-6 pb-6">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-6 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center">
                  <FaUsers className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Daftar Pasien</h1>
                  <p className="text-white/70 text-sm">Riwayat klasifikasi pasien yang sudah diproses sistem</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-2 px-4 py-3 bg-red-600/80 hover:bg-red-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300"
                >
                  <FaFilePdf className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-2 px-4 py-3 bg-emerald-600/80 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300"
                >
                  <FaFileExcel className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={() => navigate("/klasifikasi-pasien")}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300"
                >
                  <FaUserPlus className="w-5 h-5" />
                  Tambah Pasien Baru
                </button>
              </div>
            </div>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Pasien",    value: stat.total,   color: "from-purple-600 to-indigo-600" },
              { label: "Defisit Kalori",  value: stat.defisit, color: "from-orange-500 to-red-500" },
              { label: "Kalori Normal",   value: stat.normal,  color: "from-green-500 to-emerald-500" },
              { label: "Surplus Kalori",  value: stat.surplus, color: "from-blue-500 to-indigo-500" },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 shadow-xl`}>
                <p className="text-white/80 text-xs font-semibold mb-1">{s.label}</p>
                <p className="text-white text-3xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pasien..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {/* Tabel */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <FaSpinner className="w-8 h-8 text-white animate-spin mx-auto mb-3" />
                <p className="text-white/70">Memuat data...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <FaUsers className="w-16 h-16 text-white/30 mx-auto mb-3" />
                <p className="text-white/70 text-lg mb-2">
                  {search ? "Tidak ada pasien yang cocok dengan pencarian" : "Belum ada pasien yang dikelola"}
                </p>
                {!search && (
                  <button
                    onClick={() => navigate("/klasifikasi-pasien")}
                    className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all"
                  >
                    Tambah Pasien Pertama
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-white/70 text-sm font-semibold">No</th>
                      <th className="px-4 py-3 text-left text-white/70 text-sm font-semibold">Nama Pasien</th>
                      <th className="px-4 py-3 text-left text-white/70 text-sm font-semibold">Kategori Kalori</th>
                      <th className="px-4 py-3 text-left text-white/70 text-sm font-semibold">Tanggal</th>
                      <th className="px-4 py-3 text-center text-white/70 text-sm font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filtered.map((p, i) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white/80">{i + 1}</td>
                        <td className="px-4 py-3 text-white font-semibold">{p.namaPasien}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${kategoriColor[p.kategori] || "bg-gray-500/20 text-gray-400"}`}>
                            {p.kategori}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/60 text-sm">
                          {new Date(p.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => cetakPasien(p)}
                              className="p-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-lg transition-all"
                              title="Cetak Laporan"
                            >
                              <FaPrint className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => hapusPasien(p.id, p.namaPasien)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-all"
                              title="Hapus"
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
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DaftarPasien;
