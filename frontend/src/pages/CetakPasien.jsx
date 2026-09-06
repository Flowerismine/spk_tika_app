import API_URL from "../api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPrint, FaFilePdf, FaArrowLeft } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CetakPasien = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("cetakPasienData");
    if (!raw) {
      alert("Data tidak ditemukan");
      window.close();
      return;
    }
    const parsed = JSON.parse(raw);

    // Jika dari database, fetch rekomendasi makanan
    if (parsed.fromDatabase) {
      fetchMakanan(parsed);
    } else {
      setData(parsed);
    }
  }, []);

  const fetchMakanan = async (parsed) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/dataset-makanan`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // ── LAYER 1: KLASIFIKASI NAIVE BAYES MAKANAN ───────────────
      const datasetMakanan = res.data;
      const atributMakanan = ["Kalori Tinggi", "Karbo Tinggi", "Protein Tinggi", "Lemak Tinggi", "IG Tinggi"];

      // Hitung model Naive Bayes
      const totalData = datasetMakanan.length;
      const countBoleh = datasetMakanan.filter(d => d.nilai?.Kategori === "Boleh").length;
      const countTidakBoleh = totalData - countBoleh;
      const probKelas = {
        Boleh: totalData > 0 ? countBoleh / totalData : 0,
        TidakBoleh: totalData > 0 ? countTidakBoleh / totalData : 0,
      };
      const probAtribut = {};
      atributMakanan.forEach(attr => {
        probAtribut[attr] = { Boleh: {}, TidakBoleh: {} };
        const uniqueValues = [...new Set(datasetMakanan.map(d => d.nilai?.[attr]).filter(Boolean))];
        uniqueValues.forEach(val => {
          const jmlBoleh = datasetMakanan.filter(d => d.nilai?.[attr] === val && d.nilai?.Kategori === "Boleh").length;
          const jmlTidakBoleh = datasetMakanan.filter(d => d.nilai?.[attr] === val && d.nilai?.Kategori === "Tidak Boleh").length;
          probAtribut[attr].Boleh[val] = countBoleh > 0 ? jmlBoleh / countBoleh : 0;
          probAtribut[attr].TidakBoleh[val] = countTidakBoleh > 0 ? jmlTidakBoleh / countTidakBoleh : 0;
        });
      });

      // ── LAYER 2: FILTER KLINIS BERBASIS KATEGORI PASIEN ────────
      const katLower = (parsed.kategori || "").toLowerCase();
      const isDefisit = katLower.includes("defisit");
      const isSurplus = katLower.includes("surplus");

      const boleh = [];
      const tidakBoleh = [];
      datasetMakanan.forEach(m => {
        let pBoleh = probKelas.Boleh;
        let pTidakBoleh = probKelas.TidakBoleh;
        atributMakanan.forEach(attr => {
          const val = m.nilai?.[attr];
          if (val) {
            pBoleh *= probAtribut[attr].Boleh[val] ?? 0;
            pTidakBoleh *= probAtribut[attr].TidakBoleh[val] ?? 0;
          }
        });
        const prediksiNB = pBoleh > pTidakBoleh ? "Boleh" : "Tidak Boleh";
        const kategoriMakanan = m.nilai?.["Kategori Makanan"] || "-";
        const kaloriTinggi    = m.nilai?.["Kalori Tinggi"]    === "Ya";
        const lemakTinggi     = m.nilai?.["Lemak Tinggi"]     === "Ya";
        const igTinggi        = m.nilai?.["IG Tinggi"]        === "Ya";
        const karboTinggi     = m.nilai?.["Karbo Tinggi"]     === "Ya";
        const proteinTinggi   = m.nilai?.["Protein Tinggi"]   === "Ya";

        const item = {
          nama: m.nilai?.["Nama Makanan"] || "-",
          kategoriMakanan,
        };

        let bolehkah;
        if (isDefisit) {
          // Defisit Kalori: Hanya makanan rendah kalori & rendah lemak & rendah IG
          const adalahSayur   = kategoriMakanan === "Serat" || kategoriMakanan === "Sayur";
          const adalahBuah    = kategoriMakanan === "Buah";
          const adalahProtein = kategoriMakanan === "Protein";
          const adalahKarbo   = kategoriMakanan === "Karbohidrat";
          bolehkah = !igTinggi && !kaloriTinggi && !lemakTinggi && !karboTinggi && (adalahSayur || adalahBuah || adalahProtein || adalahKarbo);
        } else if (isSurplus) {
          // Surplus Kalori: Makanan bergizi & berkalori/protein tinggi, hindari IG tinggi (gula/manis ekstrim)
          const adalahKarbo   = kategoriMakanan === "Karbohidrat";
          const adalahProtein = kategoriMakanan === "Protein";
          const adalahCemilan = kategoriMakanan === "Cemilan" || kategoriMakanan === "Camilan";
          const adalahBuah    = kategoriMakanan === "Buah";
          bolehkah = !igTinggi && (adalahKarbo || adalahProtein || adalahCemilan || adalahBuah || proteinTinggi || kaloriTinggi);
        } else {
          // Normal: Pakai Naive Bayes Boleh/Tidak Boleh
          bolehkah = prediksiNB === "Boleh";
        }

        if (bolehkah) boleh.push(item);
        else tidakBoleh.push(item);
      });

      setData({ ...parsed, rekomendasi: { boleh, tidakBoleh } });
    } catch (e) {
      console.error(e);
      setData(parsed);
    }
  };

  const cetakBrowser = () => window.print();

  const downloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const ML = 15;

    // ── Header surat ──────────────────────────────────────────────────────
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PRAKTEK DOKTER UMUM dr. DESSI YULIANTI", pageW / 2, 18, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Spesialis Konsultasi Diabetes Melitus", pageW / 2, 23, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(ML, 27, pageW - ML, 27);

    // ── Judul ─────────────────────────────────────────────────────────────
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LAPORAN HASIL KLASIFIKASI KALORI", pageW / 2, 36, { align: "center" });
    doc.setFontSize(12);
    doc.text("& REKOMENDASI MENU MAKANAN PASIEN DIABETES MELITUS", pageW / 2, 42, { align: "center" });

    let y = 52;

    // ── Data pasien ───────────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Data Pasien:", ML, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const dataRows = [
      ["Nama Pasien", ": " + (data.namaPasien || "-")],
      ["Tanggal Pemeriksaan", ": " + (data.tanggal || new Date().toLocaleDateString("id-ID"))],
    ];
    if (data.nilai) {
      dataRows.push(["Jenis Kelamin",  ": " + (data.nilai["Jenis Kelamin"] || "-")]);
      dataRows.push(["Tingkat Aktivitas", ": " + (data.nilai["Aktivitas"] || "-")]);
      if (data.beratBadan)  dataRows.push(["Berat Badan", ": " + data.beratBadan + " kg"]);
      if (data.tinggiBadan) dataRows.push(["Tinggi Badan", ": " + data.tinggiBadan + " cm"]);
      dataRows.push(["Indeks Massa Tubuh (IMT)", ": " + (data.imtAngka ? data.imtAngka + " (" + (data.nilai["IMT"] || "-") + ")" : (data.nilai["IMT"] || "-"))]);
      dataRows.push(["Usia", ": " + (data.usiaAngka ? data.usiaAngka + " tahun (" + (data.nilai["Usia"] || "-") + ")" : (data.nilai["Usia"] || "-"))]);
      dataRows.push(["Tingkat Stres Metabolik", ": " + (data.nilai["Tingkat Stres"] || "-")]);
    }
    dataRows.forEach(([k, v]) => {
      doc.text(k, ML + 2, y);
      doc.text(v, ML + 55, y);
      y += 5;
    });

    y += 4;

    // ── Hasil klasifikasi ─────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Hasil Klasifikasi Kebutuhan Kalori:", ML, y);
    y += 7;

    // Box kategori
    const kategori = data.kategori || "-";
    const color = kategori === "Defisit Kalori" ? [254, 215, 170]
                : kategori === "Surplus Kalori" ? [219, 234, 254]
                : [220, 252, 231];
    const textColor = kategori === "Defisit Kalori" ? [194, 65, 12]
                    : kategori === "Surplus Kalori" ? [29, 78, 216]
                    : [21, 128, 61];
    doc.setFillColor(...color);
    doc.roundedRect(ML, y - 4, pageW - 2 * ML, 12, 2, 2, "F");
    doc.setTextColor(...textColor);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(kategori.toUpperCase(), pageW / 2, y + 3, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 14;

    // Penjelasan kategori
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    const penjelasan = {
      "Defisit Kalori": "Pasien membutuhkan asupan kalori yang lebih rendah dari kebutuhan normal. Pola makan harus terkontrol dengan baik.",
      "Surplus Kalori": "Pasien membutuhkan asupan kalori yang lebih tinggi untuk memenuhi kebutuhan tubuh. Tetap perhatikan komposisi gizi.",
      "Kalori Normal":  "Pasien membutuhkan asupan kalori sesuai standar normal. Jaga keseimbangan gizi dan kontrol gula darah.",
    };
    const lines = doc.splitTextToSize(penjelasan[kategori] || "Hasil klasifikasi sistem.", pageW - 2 * ML);
    doc.text(lines, ML, y);
    y += lines.length * 4 + 6;

    // ── Rekomendasi makanan ──────────────────────────────────────────────
    if (data.rekomendasi) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Rekomendasi Menu Makanan:", ML, y);
      y += 5;

      // BOLEH
      autoTable(doc, {
        startY: y,
        head: [["No", "Nama Makanan", "Kategori"]],
        body: data.rekomendasi.boleh.map((m, i) => [i + 1, m.nama, m.kategoriMakanan]),
        headStyles: { fillColor: [21, 128, 61], textColor: 255, fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 1.5 },
        columnStyles: { 0: { halign: "center", cellWidth: 12 }, 1: { cellWidth: 70 } },
        margin: { left: ML, right: ML },
        didDrawPage: (d) => {
          if (d.cursor.y < y + 5) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(21, 128, 61);
            doc.text("✓ MAKANAN YANG DIANJURKAN", ML, y);
            doc.setTextColor(0, 0, 0);
          }
        },
        willDrawCell: () => { doc.setFont("helvetica", "normal"); },
      });
      y = doc.lastAutoTable.finalY + 6;

      // Pindah ke halaman baru jika perlu
      if (y > 240) { doc.addPage(); y = 20; }

      // TIDAK BOLEH
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(185, 28, 28);
      doc.text("✗ MAKANAN YANG HARUS DIHINDARI", ML, y);
      doc.setTextColor(0, 0, 0);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [["No", "Nama Makanan", "Kategori"]],
        body: data.rekomendasi.tidakBoleh.map((m, i) => [i + 1, m.nama, m.kategoriMakanan]),
        headStyles: { fillColor: [185, 28, 28], textColor: 255, fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 1.5 },
        columnStyles: { 0: { halign: "center", cellWidth: 12 }, 1: { cellWidth: 70 } },
        margin: { left: ML, right: ML },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ── Catatan & TTD ────────────────────────────────────────────────────
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    const catatan = "Catatan: Rekomendasi ini bersifat panduan awal dan dapat disesuaikan dengan kondisi pasien. Hasil ini diperoleh menggunakan metode Naïve Bayes berdasarkan dataset rekam medis. Tetap konsultasikan dengan dokter dan ahli gizi untuk perencanaan diet jangka panjang.";
    const catLines = doc.splitTextToSize(catatan, pageW - 2 * ML);
    doc.text(catLines, ML, y);
    y += catLines.length * 4 + 12;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Hormat kami,", pageW - ML - 50, y);
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text("dr. Dessi Yulianti", pageW - ML - 50, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Dokter Umum", pageW - ML - 50, y + 4);

    doc.save(`Laporan_${(data.namaPasien || "Pasien").replace(/ /g, "_")}.pdf`);
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">Memuat data...</p>
      </div>
    );
  }

  const kategoriBg = {
    "Defisit Kalori": "bg-orange-100 border-orange-300 text-orange-800",
    "Surplus Kalori": "bg-blue-100 border-blue-300 text-blue-800",
    "Kalori Normal":  "bg-green-100 border-green-300 text-green-800",
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar - hidden when printing */}
      <div className="bg-white border-b shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4 flex flex-wrap gap-3 justify-between items-center">
          <button onClick={() => window.close()} className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">
            <FaArrowLeft className="w-4 h-4" />
            Tutup
          </button>
          <div className="flex gap-2">
            <button onClick={cetakBrowser} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <FaPrint className="w-4 h-4" />
              Cetak (Browser)
            </button>
            <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
              <FaFilePdf className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Surat laporan */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg my-6 print:shadow-none print:my-0">
        <div className="p-12 print:p-8">

          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-xl font-bold uppercase">Praktek Dokter Umum dr. Dessi Yulianti</h1>
            <p className="text-sm text-gray-600 mt-1">Spesialis Konsultasi Diabetes Melitus</p>
          </div>

          {/* Judul */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-1">LAPORAN HASIL KLASIFIKASI KALORI</h2>
            <p className="text-base text-gray-700">& Rekomendasi Menu Makanan Pasien Diabetes Melitus</p>
          </div>

          {/* Data Pasien */}
          <div className="mb-6">
            <h3 className="font-bold text-base mb-3 border-b pb-1">Data Pasien</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 w-1/3 text-gray-700">Nama Pasien</td>
                  <td className="py-1">: <strong>{data.namaPasien}</strong></td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-700">Tanggal Pemeriksaan</td>
                  <td className="py-1">: {data.tanggal}</td>
                </tr>
                {data.nilai && (
                  <>
                    <tr><td className="py-1 text-gray-700">Jenis Kelamin</td><td className="py-1">: {data.nilai["Jenis Kelamin"]}</td></tr>
                    <tr><td className="py-1 text-gray-700">Tingkat Aktivitas</td><td className="py-1">: {data.nilai["Aktivitas"]}</td></tr>
                    {data.beratBadan  && <tr><td className="py-1 text-gray-700">Berat Badan</td><td className="py-1">: {data.beratBadan} kg</td></tr>}
                    {data.tinggiBadan && <tr><td className="py-1 text-gray-700">Tinggi Badan</td><td className="py-1">: {data.tinggiBadan} cm</td></tr>}
                    <tr><td className="py-1 text-gray-700">Indeks Massa Tubuh</td><td className="py-1">: {data.imtAngka ? `${data.imtAngka} (${data.nilai["IMT"]})` : data.nilai["IMT"]}</td></tr>
                    <tr><td className="py-1 text-gray-700">Usia</td><td className="py-1">: {data.usiaAngka ? `${data.usiaAngka} tahun (${data.nilai["Usia"]})` : data.nilai["Usia"]}</td></tr>
                    <tr><td className="py-1 text-gray-700">Tingkat Stres Metabolik</td><td className="py-1">: {data.nilai["Tingkat Stres"]}</td></tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Hasil Klasifikasi */}
          <div className="mb-6">
            <h3 className="font-bold text-base mb-3 border-b pb-1">Hasil Klasifikasi Kebutuhan Kalori</h3>
            <div className={`border-2 rounded-lg p-4 text-center ${kategoriBg[data.kategori] || "bg-gray-100"}`}>
              <p className="text-2xl font-bold">{data.kategori}</p>
            </div>
            <p className="text-sm text-gray-700 mt-3 italic">
              {data.kategori === "Defisit Kalori" && "Pasien membutuhkan asupan kalori yang lebih rendah dari kebutuhan normal. Pola makan harus terkontrol dengan baik."}
              {data.kategori === "Surplus Kalori" && "Pasien membutuhkan asupan kalori yang lebih tinggi untuk memenuhi kebutuhan tubuh. Tetap perhatikan komposisi gizi."}
              {data.kategori === "Kalori Normal" && "Pasien membutuhkan asupan kalori sesuai standar normal. Jaga keseimbangan gizi dan kontrol gula darah."}
            </p>
          </div>

          {/* Rekomendasi Makanan */}
          {data.rekomendasi && (
            <div className="mb-6">
              <h3 className="font-bold text-base mb-3 border-b pb-1">Rekomendasi Menu Makanan</h3>

              <div className="mb-4">
                <p className="font-bold text-green-700 text-sm mb-2">✓ MAKANAN YANG DIANJURKAN</p>
                <table className="w-full text-sm border border-gray-300">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1 w-12">No</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Nama Makanan</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Kategori</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rekomendasi.boleh.map((m, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 px-2 py-1 text-center">{i + 1}</td>
                        <td className="border border-gray-300 px-2 py-1">{m.nama}</td>
                        <td className="border border-gray-300 px-2 py-1 text-gray-600">{m.kategoriMakanan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <p className="font-bold text-red-700 text-sm mb-2">✗ MAKANAN YANG HARUS DIHINDARI</p>
                <table className="w-full text-sm border border-gray-300">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1 w-12">No</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Nama Makanan</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Kategori</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rekomendasi.tidakBoleh.map((m, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 px-2 py-1 text-center">{i + 1}</td>
                        <td className="border border-gray-300 px-2 py-1">{m.nama}</td>
                        <td className="border border-gray-300 px-2 py-1 text-gray-600">{m.kategoriMakanan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Catatan */}
          <div className="mb-8 text-xs text-gray-600 italic border-t pt-3">
            <p>Catatan: Rekomendasi ini bersifat panduan awal dan dapat disesuaikan dengan kondisi pasien. Hasil ini diperoleh menggunakan metode Naïve Bayes berdasarkan dataset rekam medis. Tetap konsultasikan dengan dokter dan ahli gizi untuk perencanaan diet jangka panjang.</p>
          </div>

          {/* TTD */}
          <div className="flex justify-end mt-12">
            <div className="text-center">
              <p className="text-sm">Hormat kami,</p>
              <div className="h-16"></div>
              <p className="font-bold border-t border-gray-700 pt-1 px-4">dr. Dessi Yulianti</p>
              <p className="text-xs text-gray-600">Dokter Umum</p>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default CetakPasien;
