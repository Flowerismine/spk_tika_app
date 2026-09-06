import API_URL from "../api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getMe } from "../features/authSlice";
import {
  FaCalculator, FaSave, FaChartLine, FaTable,
  FaCheckCircle, FaExclamationTriangle, FaFileExcel, FaFilePdf
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PerhitunganMakanan = () => {
  const [kriteriaMakanan, setKriteriaMakanan] = useState([]);
  const [datasetMakanan, setDatasetMakanan]   = useState([]);
  const [hasilPerhitungan, setHasilPerhitungan] = useState(null);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => { dispatch(getMe()); }, [dispatch]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) { getKriteriaMakanan(); getDatasetMakanan(); }
    else navigate("/");
  }, [navigate]);

  const fetchData = async (url, setter) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setter(res.data);
    } catch (e) { console.error(e); }
  };

  const getKriteriaMakanan = () => fetchData(`${API_URL}/kriteria-makanan`, setKriteriaMakanan);
  const getDatasetMakanan  = () => fetchData(`${API_URL}/dataset-makanan`,  setDatasetMakanan);

  const handleHitungKlasifikasi = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/hitung-makanan`, { headers: { Authorization: `Bearer ${token}` } });
      const hasilMakanan = res.data;
      const hasilAkhir = hasilMakanan.prediksi.map(p => ({
        namaMakanan: p.data["Nama Makanan"] || "",
        kategori:    p.klasifikasi,
      }));
      setHasilPerhitungan({ makanan: hasilMakanan, hasilAkhir });
    } catch (e) {
      console.error(e);
      alert("Gagal menghitung klasifikasi makanan: " + (e.response?.data?.msg || e.message));
    } finally {
      setLoading(false);
    }
  };

  // ─── EXPORT EXCEL ────────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!hasilPerhitungan) return;
    const { makanan, hasilAkhir } = hasilPerhitungan;
    const wb = XLSX.utils.book_new();

    // Styling helpers
    const styleHeader = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4338CA" } }, alignment: { horizontal: "center", wrapText: true }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleSubHeader = { font: { bold: true }, fill: { fgColor: { rgb: "E0E7FF" } }, alignment: { horizontal: "center", wrapText: true }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleCell = { alignment: { horizontal: "center", wrapText: true }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleBoleh    = { font: { bold: true, color: { rgb: "15803D" } }, fill: { fgColor: { rgb: "DCFCE7" } }, alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleTidakB   = { font: { bold: true, color: { rgb: "B91C1C" } }, fill: { fgColor: { rgb: "FEE2E2" } }, alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleSesuai      = { font: { bold: true, color: { rgb: "15803D" } }, fill: { fgColor: { rgb: "DCFCE7" } }, alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleTidakSesuai = { font: { bold: true, color: { rgb: "B91C1C" } }, fill: { fgColor: { rgb: "FEE2E2" } }, alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };

    const applyStyle = (ws, cellAddr, style) => {
      if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
      ws[cellAddr].s = style;
    };

    // ── SHEET 1: Dataset Training ──────────────────────────────────────────────
    const dsHeader = ["No", "Nama Makanan", ...makanan.atribut, "Kategori"];
    const dsRows   = [dsHeader];
    makanan.prediksi.forEach(p => {
      dsRows.push([p.no, p.data?.["Nama Makanan"] || "-", ...makanan.atribut.map(a => p.data?.[a] || "-"), p.kategoriAktual]);
    });
    const wsDs = XLSX.utils.aoa_to_sheet(dsRows);
    dsHeader.forEach((_, ci) => applyStyle(wsDs, XLSX.utils.encode_cell({ r: 0, c: ci }), styleHeader));
    wsDs["!cols"] = dsHeader.map((h, i) => ({ wch: i === 1 ? 26 : 16 }));
    XLSX.utils.book_append_sheet(wb, wsDs, "1. Dataset");

    // ── SHEET 2: Langkah 1 — Probabilitas Kelas ───────────────────────────────
    const klsRows = [
      ["LANGKAH 1 — PROBABILITAS KELAS (Klasifikasi Makanan)", "", "", "", ""],
      ["", "", "", "", ""],
      ["Rumus:", "P(Kelas) = Jumlah data kelas / Total data", "", "", ""],
      ["", "", "", "", ""],
      ["Kelas", "Jumlah Data Kelas", "Total Data", "Perhitungan", "P(Kelas)"],
      ["Boleh",       makanan.countBoleh,      makanan.totalData, `${makanan.countBoleh} / ${makanan.totalData}`,      +makanan.probabilitasKelas.Boleh.toFixed(6)],
      ["Tidak Boleh", makanan.countTidakBoleh, makanan.totalData, `${makanan.countTidakBoleh} / ${makanan.totalData}`, +makanan.probabilitasKelas.TidakBoleh.toFixed(6)],
    ];
    const wsKls = XLSX.utils.aoa_to_sheet(klsRows);
    [0,1,2,3,4].forEach(ci => applyStyle(wsKls, XLSX.utils.encode_cell({ r: 4, c: ci }), styleHeader));
    applyStyle(wsKls, XLSX.utils.encode_cell({ r: 5, c: 4 }), styleBoleh);
    applyStyle(wsKls, XLSX.utils.encode_cell({ r: 6, c: 4 }), styleTidakB);
    wsKls["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } }];
    wsKls["!cols"]   = [{ wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsKls, "2. Prob Kelas");

    // ── SHEET 3: Langkah 2 — Probabilitas Atribut (dengan jumlah) ─────────────
    const atRows = [
      ["LANGKAH 2 — PROBABILITAS ATRIBUT (Klasifikasi Makanan)", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["Rumus:", "P(Atribut=nilai | Kelas) = Jumlah kemunculan nilai pada kelas / Jumlah total data kelas", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["Atribut", "Nilai", "Jml pada \"Boleh\"", "Total \"Boleh\"", "P(Attr | Boleh)", "Jml pada \"Tidak Boleh\"", "Total \"Tidak Boleh\"", "P(Attr | Tidak Boleh)"],
    ];
    Object.entries(makanan.probabilitasAtribut).forEach(([attr, vals]) => {
      const allVals = [...new Set([...Object.keys(vals.Boleh), ...Object.keys(vals.TidakBoleh)])];
      allVals.forEach((val, vi) => {
        const jmlB = Math.round((vals.Boleh[val]      ?? 0) * makanan.countBoleh);
        const jmlT = Math.round((vals.TidakBoleh[val] ?? 0) * makanan.countTidakBoleh);
        atRows.push([
          vi === 0 ? attr : "",
          val,
          jmlB, makanan.countBoleh,      vals.Boleh[val]      != null ? `${jmlB} / ${makanan.countBoleh} = ${vals.Boleh[val].toFixed(6)}`           : `0 / ${makanan.countBoleh} = 0.000000`,
          jmlT, makanan.countTidakBoleh, vals.TidakBoleh[val] != null ? `${jmlT} / ${makanan.countTidakBoleh} = ${vals.TidakBoleh[val].toFixed(6)}` : `0 / ${makanan.countTidakBoleh} = 0.000000`,
        ]);
      });
    });
    const wsAt = XLSX.utils.aoa_to_sheet(atRows);
    [0,1,2,3,4,5,6,7].forEach(ci => applyStyle(wsAt, XLSX.utils.encode_cell({ r: 4, c: ci }), styleHeader));
    wsAt["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, { s: { r: 2, c: 1 }, e: { r: 2, c: 7 } }];
    wsAt["!cols"] = [{ wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 36 }, { wch: 22 }, { wch: 18 }, { wch: 36 }];
    XLSX.utils.book_append_sheet(wb, wsAt, "3. Prob Atribut");

    // ── SHEET 4: Langkah 3 — Detail Perkalian Per Data ────────────────────────
    const subH1 = ["No", "Nama Makanan"];
    makanan.atribut.forEach(a => subH1.push(a, "", "", ""));
    subH1.push("", "", "", "", "Fakta", "Klasifikasi", "Prediksi");

    const subH2 = ["", ""];
    makanan.atribut.forEach(() => subH2.push("Nilai", "P(Attr|Boleh)", "×", "P(Attr|Tidak Boleh)"));
    subH2.push("P(Boleh)", "P(Tidak Boleh)", "Akumulasi P(Boleh)", "Akumulasi P(Tidak Boleh)", "", "", "");

    const pkRows = [subH1, subH2];
    makanan.prediksi.forEach(p => {
      const row = [p.no, p.data?.["Nama Makanan"] || "-"];
      p.detailFaktor.forEach(f => row.push(f.val, f.pBoleh.toFixed(6), "×", f.pTidakBoleh.toFixed(6)));
      row.push(
        makanan.probabilitasKelas.Boleh.toFixed(6),
        makanan.probabilitasKelas.TidakBoleh.toFixed(6),
        p.probBoleh.toFixed(8),
        p.probTidakBoleh.toFixed(8),
        p.kategoriAktual,
        p.klasifikasi,
        p.prediksiSesuai,
      );
      pkRows.push(row);
    });
    const wsPk = XLSX.utils.aoa_to_sheet(pkRows);
    subH1.forEach((_, ci) => applyStyle(wsPk, XLSX.utils.encode_cell({ r: 0, c: ci }), styleHeader));
    subH2.forEach((_, ci) => applyStyle(wsPk, XLSX.utils.encode_cell({ r: 1, c: ci }), styleSubHeader));
    makanan.prediksi.forEach((p, ri) => {
      const totalCols = subH1.length;
      for (let ci = 0; ci < totalCols; ci++) applyStyle(wsPk, XLSX.utils.encode_cell({ r: ri + 2, c: ci }), styleCell);
      const baseCol = 2 + makanan.atribut.length * 4;
      applyStyle(wsPk, XLSX.utils.encode_cell({ r: ri + 2, c: baseCol + 2 }), styleBoleh);
      applyStyle(wsPk, XLSX.utils.encode_cell({ r: ri + 2, c: baseCol + 3 }), styleTidakB);
      applyStyle(wsPk, XLSX.utils.encode_cell({ r: ri + 2, c: totalCols - 1 }), p.prediksiSesuai === "SESUAI" ? styleSesuai : styleTidakSesuai);
    });
    const pkCols = [{ wch: 5 }, { wch: 26 }];
    makanan.atribut.forEach(() => pkCols.push({ wch: 12 }, { wch: 14 }, { wch: 4 }, { wch: 14 }));
    pkCols.push({ wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 14 });
    wsPk["!cols"] = pkCols;
    XLSX.utils.book_append_sheet(wb, wsPk, "4. Detail Perkalian");

    // ── SHEET 5: Ringkasan Pembuktian ─────────────────────────────────────────
    const rbHeader = ["No", "Nama Makanan", ...makanan.atribut.map(a => `Nilai ${a}`),
      "Rumus P(Boleh)", "Hasil P(Boleh)", "Rumus P(Tidak Boleh)", "Hasil P(Tidak Boleh)",
      "Fakta", "Klasifikasi", "Prediksi"];
    const rbRows = [
      ["LANGKAH 3 — RINGKASAN TABEL PEMBUKTIAN (Klasifikasi Makanan)", ...Array(rbHeader.length - 1).fill("")],
      ["", ...Array(rbHeader.length - 1).fill("")],
      rbHeader,
    ];
    makanan.prediksi.forEach(p => {
      rbRows.push([p.no, p.data?.["Nama Makanan"] || "-", ...makanan.atribut.map(a => p.data?.[a] || "-"),
        p.rumusBoleh, +p.probBoleh.toFixed(8), p.rumusTidakBoleh, +p.probTidakBoleh.toFixed(8),
        p.kategoriAktual, p.klasifikasi, p.prediksiSesuai]);
    });
    const wsRb = XLSX.utils.aoa_to_sheet(rbRows);
    rbHeader.forEach((_, ci) => applyStyle(wsRb, XLSX.utils.encode_cell({ r: 2, c: ci }), styleHeader));
    makanan.prediksi.forEach((p, ri) => {
      const r = ri + 3;
      rbHeader.forEach((_, ci) => applyStyle(wsRb, XLSX.utils.encode_cell({ r, c: ci }), styleCell));
      applyStyle(wsRb, XLSX.utils.encode_cell({ r, c: rbHeader.length - 4 }), styleBoleh);
      applyStyle(wsRb, XLSX.utils.encode_cell({ r, c: rbHeader.length - 2 }), styleTidakB);
      applyStyle(wsRb, XLSX.utils.encode_cell({ r, c: rbHeader.length - 1 }), p.prediksiSesuai === "SESUAI" ? styleSesuai : styleTidakSesuai);
    });
    wsRb["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: rbHeader.length - 1 } }];
    wsRb["!cols"]   = [{ wch: 5 }, { wch: 26 }, ...makanan.atribut.map(() => ({ wch: 16 })), { wch: 50 }, { wch: 16 }, { wch: 50 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsRb, "5. Ringkasan Pembuktian");

    // ── SHEET 6: Hasil Akhir ──────────────────────────────────────────────────
    const akhirRows = [
      ["HASIL AKHIR KLASIFIKASI MAKANAN", "", ""],
      ["", "", ""],
      ["No", "Nama Makanan", "Kategori"],
    ];
    hasilAkhir.forEach((h, i) => akhirRows.push([i + 1, h.namaMakanan, h.kategori]));
    const wsAkhir = XLSX.utils.aoa_to_sheet(akhirRows);
    [0, 1, 2].forEach(ci => applyStyle(wsAkhir, XLSX.utils.encode_cell({ r: 2, c: ci }), styleHeader));
    hasilAkhir.forEach((h, i) => {
      const r = i + 3;
      [0, 1, 2].forEach(ci => applyStyle(wsAkhir, XLSX.utils.encode_cell({ r, c: ci }), styleCell));
      applyStyle(wsAkhir, XLSX.utils.encode_cell({ r, c: 2 }), h.kategori === "Boleh" ? styleBoleh : styleTidakB);
    });
    wsAkhir["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    wsAkhir["!cols"]   = [{ wch: 6 }, { wch: 30 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsAkhir, "6. Hasil Akhir");

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "Pembuktian_NaiveBayes_Makanan.xlsx");
  };

  // ─── EXPORT PDF ──────────────────────────────────────────────────────────────
  const exportPDF = () => {
    if (!hasilPerhitungan) return;
    const { makanan, hasilAkhir } = hasilPerhitungan;
    const doc   = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const ML = 14, MR = 14;
    const HEADER_COLOR  = [67, 56, 202];
    const SUBHEAD_COLOR = [99, 102, 241];
    const GREEN_BG   = [220, 252, 231];  const GREEN_TEXT = [21, 128, 61];
    const RED_BG     = [254, 226, 226];  const RED_TEXT   = [185, 28, 28];

    // ── Helpers ──────────────────────────────────────────────────────────────
    const drawPageHeader = (sectionTitle) => {
      doc.setFillColor(...HEADER_COLOR);
      doc.rect(0, 0, pageW, 10, "F");
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
      doc.text("PEMBUKTIAN NAÏVE BAYES — KLASIFIKASI MAKANAN", ML, 6.5);
      doc.text(sectionTitle, pageW - MR, 6.5, { align: "right" });
      doc.setTextColor(0, 0, 0);
    };

    const drawPageFooter = () => {
      const pageNum = doc.internal.getNumberOfPages();
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2);
      doc.line(ML, pageH - 8, pageW - MR, pageH - 8);
      doc.text("Sistem Pendukung Keputusan Menu Makanan Bergizi Penderita Diabetes Melitus", ML, pageH - 4);
      doc.text(`Halaman ${pageNum}`, pageW - MR, pageH - 4, { align: "right" });
      doc.setTextColor(0, 0, 0);
    };

    const addPageFull = (sec) => { doc.addPage(); drawPageHeader(sec); drawPageFooter(); };

    const patchFooters = () => {
      const total = doc.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) { doc.setPage(i); drawPageFooter(); }
    };

    let y = 14;
    const curSection = { v: "" };

    const sectionTitle = (txt, sub = false) => {
      if (sub) {
        doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...SUBHEAD_COLOR);
        doc.text(txt, ML, y); doc.setTextColor(0, 0, 0); y += 5;
      } else {
        doc.setFillColor(240, 240, 255);
        doc.roundedRect(ML, y - 4, pageW - ML - MR, 8, 1, 1, "F");
        doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...HEADER_COLOR);
        doc.text(txt, ML + 3, y + 0.5); doc.setTextColor(0, 0, 0); y += 8;
      }
    };

    const rumusNote = (txt) => {
      doc.setFontSize(7); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
      doc.text(txt, ML + 2, y); doc.setTextColor(0, 0, 0); y += 4;
    };

    const addTable = (head, body, opts = {}) => {
      const { colStyles = {}, rowColors = null, boldLast = false } = opts;
      autoTable(doc, {
        startY: y,
        head: [head],
        body,
        styles:      { fontSize: 7, cellPadding: 1.5, valign: "middle", lineColor: [200, 200, 200], lineWidth: 0.2 },
        headStyles:  { fillColor: HEADER_COLOR, textColor: 255, fontStyle: "bold", halign: "center", fontSize: 7.5 },
        columnStyles: colStyles,
        margin: { left: ML, right: MR },
        theme: "grid",
        didParseCell: (data) => {
          if (data.section === "body" && rowColors) {
            const rc = rowColors[data.row.index];
            if (rc) { data.cell.styles.fillColor = rc.bg; data.cell.styles.textColor = rc.text; data.cell.styles.fontStyle = "bold"; }
          }
          if (boldLast && data.section === "body" && data.column.index === head.length - 1) {
            const val = data.cell.raw;
            if (val === "SESUAI")       { data.cell.styles.fillColor = GREEN_BG; data.cell.styles.textColor = GREEN_TEXT; data.cell.styles.fontStyle = "bold"; }
            if (val === "TIDAK SESUAI") { data.cell.styles.fillColor = RED_BG;   data.cell.styles.textColor = RED_TEXT;   data.cell.styles.fontStyle = "bold"; }
          }
        },
      });
      y = doc.lastAutoTable.finalY + 6;
      patchFooters();
      doc.setPage(doc.internal.getNumberOfPages());
      if (y > pageH - 20) { addPageFull(curSection.v); y = 14; }
    };

    // ── COVER PAGE ────────────────────────────────────────────────────────────
    doc.setFillColor(...HEADER_COLOR);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PEMBUKTIAN PERHITUNGAN", pageW / 2, 16, { align: "center" });
    doc.setFontSize(16);
    doc.text("NAÏVE BAYES — KLASIFIKASI MAKANAN", pageW / 2, 25, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("Sistem Pendukung Keputusan Menu Makanan Bergizi Penderita Diabetes Melitus", pageW / 2, 34, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Summary box
    doc.setFillColor(245, 245, 255);
    doc.roundedRect(ML, 50, pageW - ML - MR, 35, 3, 3, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...HEADER_COLOR);
    doc.text("Ringkasan Dokumen", ML + 5, 58);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
    [
      `Total Data Makanan   : ${makanan.totalData} data`,
      `Kelas Target         : Boleh / Tidak Boleh`,
      `Atribut yang digunakan : ${makanan.atribut.join(", ")}`,
      `Metode               : Naïve Bayes (Probabilistic Classifier)`,
    ].forEach((line, i) => doc.text(line, ML + 5, 65 + i * 7));
    doc.setTextColor(0, 0, 0);

    // Daftar isi
    doc.setFillColor(245, 245, 255);
    doc.roundedRect(ML, 93, pageW - ML - MR, 55, 3, 3, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...HEADER_COLOR);
    doc.text("Daftar Isi", ML + 5, 101);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
    [
      "Halaman 2  — Dataset Training Makanan",
      "Halaman 3  — Langkah 1: Probabilitas Kelas",
      "Halaman 3  — Langkah 2: Probabilitas Atribut",
      "Halaman 4  — Langkah 3: Detail Perkalian Per Data",
      "Halaman 5  — Langkah 3: Ringkasan Tabel Pembuktian",
      "Halaman 6  — Hasil Akhir Klasifikasi Makanan",
    ].forEach((t, i) => doc.text(t, ML + 5, 108 + i * 7));
    doc.setTextColor(0, 0, 0);
    drawPageFooter();

    // ── PAGE 2: Dataset ────────────────────────────────────────────────────────
    curSection.v = "Dataset";
    addPageFull("Dataset");
    y = 14;
    sectionTitle("Dataset Training Makanan");
    rumusNote(`Total data: ${makanan.totalData} baris  |  Boleh: ${makanan.countBoleh}  |  Tidak Boleh: ${makanan.countTidakBoleh}`);

    const dsHead = ["No", "Nama Makanan", ...makanan.atribut, "Kategori"];
    const dsBody = makanan.prediksi.map(p => [
      p.no, p.data?.["Nama Makanan"] || "-",
      ...makanan.atribut.map(a => p.data?.[a] || "-"),
      p.kategoriAktual,
    ]);
    const dsRowColors = makanan.prediksi.map(p =>
      p.kategoriAktual === "Boleh"
        ? { bg: GREEN_BG, text: GREEN_TEXT }
        : { bg: RED_BG, text: RED_TEXT }
    );
    addTable(dsHead, dsBody, {
      colStyles: { 0: { halign: "center", cellWidth: 8 }, 1: { cellWidth: 38 } },
      rowColors: dsRowColors,
    });

    // ── PAGE 3: Langkah 1 + 2 ─────────────────────────────────────────────────
    curSection.v = "Langkah 1 & 2";
    addPageFull("Langkah 1 & 2");
    y = 14;

    sectionTitle("Langkah 1 — Probabilitas Kelas");
    rumusNote("Rumus: P(Kelas) = Jumlah data kelas / Total data");
    addTable(
      ["Kelas", "Jumlah Data Kelas", "Total Data", "Perhitungan", "P(Kelas)"],
      [
        ["Boleh",       makanan.countBoleh,      makanan.totalData, `${makanan.countBoleh} / ${makanan.totalData}`,      makanan.probabilitasKelas.Boleh.toFixed(6)],
        ["Tidak Boleh", makanan.countTidakBoleh, makanan.totalData, `${makanan.countTidakBoleh} / ${makanan.totalData}`, makanan.probabilitasKelas.TidakBoleh.toFixed(6)],
      ],
      {
        colStyles: { 0: { halign: "center" }, 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" }, 4: { halign: "center", fontStyle: "bold" } },
        rowColors: [{ bg: GREEN_BG, text: GREEN_TEXT }, { bg: RED_BG, text: RED_TEXT }],
      }
    );

    sectionTitle("Langkah 2 — Probabilitas Atribut");
    rumusNote("Rumus: P(Atribut=nilai | Kelas) = Jumlah kemunculan nilai pada kelas / Jumlah total data kelas");
    const attrHead = ["Atribut", "Nilai", "Jml pada \"Boleh\"", "Total \"Boleh\"", "P(Attr | Boleh)", "Jml pada \"Tidak Boleh\"", "Total \"Tidak Boleh\"", "P(Attr | Tidak Boleh)"];
    const attrBody = [];
    Object.entries(makanan.probabilitasAtribut).forEach(([attr, vals]) => {
      const allVals = [...new Set([...Object.keys(vals.Boleh), ...Object.keys(vals.TidakBoleh)])];
      allVals.forEach((val, vi) => {
        const jmlB = Math.round((vals.Boleh[val]      ?? 0) * makanan.countBoleh);
        const jmlT = Math.round((vals.TidakBoleh[val] ?? 0) * makanan.countTidakBoleh);
        attrBody.push([
          vi === 0 ? attr : "", val,
          jmlB, makanan.countBoleh,      vals.Boleh[val]      != null ? `${jmlB} / ${makanan.countBoleh} = ${vals.Boleh[val].toFixed(4)}`           : `0 / ${makanan.countBoleh} = 0`,
          jmlT, makanan.countTidakBoleh, vals.TidakBoleh[val] != null ? `${jmlT} / ${makanan.countTidakBoleh} = ${vals.TidakBoleh[val].toFixed(4)}` : `0 / ${makanan.countTidakBoleh} = 0`,
        ]);
      });
    });
    addTable(attrHead, attrBody, {
      colStyles: {
        0: { fontStyle: "bold", cellWidth: 26 }, 1: { halign: "center", cellWidth: 14 },
        2: { halign: "center", cellWidth: 16 },  3: { halign: "center", cellWidth: 14 },
        4: { halign: "center", cellWidth: 38 },  5: { halign: "center", cellWidth: 20 },
        6: { halign: "center", cellWidth: 14 },  7: { halign: "center" },
      },
    });

    // ── PAGE 4: Langkah 3 — Detail Perkalian ─────────────────────────────────
    curSection.v = "Langkah 3 — Detail Perkalian";
    addPageFull("Langkah 3 — Detail Perkalian");
    y = 14;
    sectionTitle("Langkah 3 — Detail Perkalian Per Data");
    rumusNote("Rumus: P(posterior) = P(Kelas) × ∏ P(Attr|Kelas)   →   Kelas dengan nilai tertinggi = hasil klasifikasi");

    const pkHead = [
      "No", "Nama Makanan",
      ...makanan.atribut.flatMap(a => [`Nilai\n${a}`, `P(${a}|Boleh)`, `P(${a}|Tdk)`]),
      "P(Boleh)", "P(Tdk Boleh)", "Akumulasi\nP(Boleh)", "Akumulasi\nP(Tdk Boleh)",
      "Fakta", "Klasifikasi", "Prediksi",
    ];
    const pkBody = makanan.prediksi.map(p => {
      const row = [p.no, p.data?.["Nama Makanan"] || "-"];
      p.detailFaktor.forEach(f => row.push(f.val, f.pBoleh.toFixed(4), f.pTidakBoleh.toFixed(4)));
      row.push(
        makanan.probabilitasKelas.Boleh.toFixed(4),
        makanan.probabilitasKelas.TidakBoleh.toFixed(4),
        p.probBoleh.toFixed(6),
        p.probTidakBoleh.toFixed(6),
        p.kategoriAktual, p.klasifikasi, p.prediksiSesuai,
      );
      return row;
    });

    const akumBCol  = 2 + makanan.atribut.length * 3 + 2;
    const akumTkCol = akumBCol + 1;
    const pkColStyles = { 0: { halign: "center", cellWidth: 8 }, 1: { cellWidth: 30 } };
    makanan.atribut.forEach((_, i) => {
      pkColStyles[2 + i * 3]     = { halign: "center", cellWidth: 14 };
      pkColStyles[2 + i * 3 + 1] = { halign: "center", cellWidth: 16, textColor: GREEN_TEXT };
      pkColStyles[2 + i * 3 + 2] = { halign: "center", cellWidth: 16, textColor: RED_TEXT };
    });
    pkColStyles[akumBCol - 2]  = { halign: "center", cellWidth: 14 };
    pkColStyles[akumBCol - 1]  = { halign: "center", cellWidth: 14 };
    pkColStyles[akumBCol]      = { halign: "center", cellWidth: 18, fontStyle: "bold", textColor: GREEN_TEXT };
    pkColStyles[akumTkCol]     = { halign: "center", cellWidth: 18, fontStyle: "bold", textColor: RED_TEXT };
    pkColStyles[akumTkCol + 1] = { halign: "center", cellWidth: 12 };
    pkColStyles[akumTkCol + 2] = { halign: "center", cellWidth: 16, fontStyle: "bold" };
    addTable(pkHead, pkBody, { colStyles: pkColStyles, boldLast: true });

    // ── PAGE 5: Ringkasan Pembuktian ─────────────────────────────────────────
    curSection.v = "Ringkasan Pembuktian";
    addPageFull("Ringkasan Pembuktian");
    y = 14;
    sectionTitle("Ringkasan Tabel Pembuktian", true);
    rumusNote("Tabel ini merangkum rumus perkalian lengkap, hasil akhir probabilitas, dan keputusan klasifikasi per data makanan.");
    const rbHead = ["No", "Nama Makanan", ...makanan.atribut.map(a => `Nilai ${a}`),
      "Rumus P(Boleh)", "P(Boleh)", "Rumus P(Tidak Boleh)", "P(Tidak Boleh)",
      "Fakta", "Klasifikasi", "Prediksi"];
    const rbBody = makanan.prediksi.map(p => [
      p.no, p.data?.["Nama Makanan"] || "-",
      ...makanan.atribut.map(a => p.data?.[a] || "-"),
      p.rumusBoleh,      p.probBoleh.toFixed(6),
      p.rumusTidakBoleh, p.probTidakBoleh.toFixed(6),
      p.kategoriAktual, p.klasifikasi, p.prediksiSesuai,
    ]);
    const rbCols = { 0: { halign: "center", cellWidth: 8 }, 1: { cellWidth: 32 } };
    makanan.atribut.forEach((_, i) => { rbCols[i + 2] = { halign: "center", cellWidth: 16 }; });
    const base = 2 + makanan.atribut.length;
    rbCols[base]     = { cellWidth: 50 };
    rbCols[base + 1] = { halign: "center", cellWidth: 16, fontStyle: "bold", textColor: GREEN_TEXT };
    rbCols[base + 2] = { cellWidth: 50 };
    rbCols[base + 3] = { halign: "center", cellWidth: 16, fontStyle: "bold", textColor: RED_TEXT };
    rbCols[base + 4] = { halign: "center", cellWidth: 14 };
    rbCols[base + 5] = { halign: "center", cellWidth: 16, fontStyle: "bold" };
    addTable(rbHead, rbBody, { colStyles: rbCols, boldLast: true });

    // ── PAGE 6: Hasil Akhir ────────────────────────────────────────────────────
    curSection.v = "Hasil Akhir";
    addPageFull("Hasil Akhir");
    y = 14;
    sectionTitle("Hasil Akhir Klasifikasi Makanan");
    rumusNote("Makanan diklasifikasikan Boleh atau Tidak Boleh dikonsumsi oleh pasien Diabetes Melitus.");

    const hasilRowColors = hasilAkhir.map(h =>
      h.kategori === "Boleh"
        ? { bg: GREEN_BG, text: GREEN_TEXT }
        : { bg: RED_BG,   text: RED_TEXT }
    );
    addTable(
      ["No", "Nama Makanan", "Kategori"],
      hasilAkhir.map((h, i) => [i + 1, h.namaMakanan, h.kategori]),
      {
        colStyles: { 0: { halign: "center", cellWidth: 12 }, 1: { cellWidth: 100 }, 2: { halign: "center", fontStyle: "bold" } },
        rowColors: hasilRowColors,
      }
    );

    // Statistik
    const bolehCount    = hasilAkhir.filter(h => h.kategori === "Boleh").length;
    const tidakBolehCount = hasilAkhir.filter(h => h.kategori === "Tidak Boleh").length;
    if (y + 25 < pageH - 15) {
      doc.setFillColor(245, 245, 255);
      doc.roundedRect(ML, y, pageW - ML - MR, 22, 2, 2, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...HEADER_COLOR);
      doc.text("Statistik Hasil Klasifikasi", ML + 4, y + 7);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
      doc.text(`Boleh dikonsumsi     : ${bolehCount} makanan`,    ML + 4, y + 14);
      doc.text(`Tidak Boleh dikonsumsi : ${tidakBolehCount} makanan`, ML + 90, y + 14);
      doc.setTextColor(0, 0, 0);
    }

    patchFooters();
    doc.save("Pembuktian_NaiveBayes_Makanan.pdf");
  };

  // ─── SAVE TO DB ──────────────────────────────────────────────────────────────
  const saveHasilAkhirToDatabase = async () => {
    if (!hasilPerhitungan?.hasilAkhir) { alert("Tidak ada data untuk disimpan."); return; }
    try {
      const token   = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      await axios.delete(`${API_URL}/hasil-akhir-makanan?confirm=true`, { headers });
      await axios.post(`${API_URL}/hasil-akhir-makanan`,
        { hasilAkhirMakanan: hasilPerhitungan.hasilAkhir.map(i => ({ namaMakanan: i.namaMakanan, kategori: i.kategori })) },
        { headers }
      );
      alert("Hasil akhir makanan berhasil disimpan ke database!");
    } catch (e) {
      alert(`Error menyimpan: ${e.response?.data?.msg || e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)]"></div>
      </div>
      <div className="hidden md:block absolute top-20 left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="hidden md:block absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 pt-20 sm:pt-24 md:pt-6 px-4 sm:px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Sistem Klasifikasi Naive Bayes</h1>
            <p className="text-sm sm:text-base text-white/70">Analisis Kategori Makanan yang Boleh dan Tidak Boleh</p>
          </div>

          {/* Tabel Dataset */}
          <div className="mb-6">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600/80 via-purple-600/80 to-blue-600/80 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <FaChartLine className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Dataset Makanan Boleh dan Tidak Boleh</h2>
                    <p className="text-sm text-white/80">Data yang akan digunakan untuk klasifikasi</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-white/70 uppercase">No</th>
                      {kriteriaMakanan.map(k => (
                        <th key={k.id} className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-white/70 uppercase min-w-[120px]">{k.namaKriteria}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {datasetMakanan.map((item, i) => (
                      <tr key={item.id} className="hover:bg-white/5">
                        <td className="px-3 sm:px-6 py-3 text-white font-medium text-sm">{i + 1}</td>
                        {kriteriaMakanan.map(k => (
                          <td key={k.id} className="px-3 sm:px-6 py-3 text-white/80 text-sm">{item.nilai?.[k.namaKriteria] || "-"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tombol Hitung */}
          <div className="flex justify-center mb-6">
            <button onClick={handleHitungKlasifikasi}
              className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-xl shadow-indigo-500/25 transition-all duration-300 transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative flex items-center gap-3">
                <FaCalculator className="w-5 h-5" />
                <span className="text-sm sm:text-lg">Hitung Klasifikasi Naive Bayes</span>
              </div>
            </button>
          </div>

          {hasilPerhitungan && (
            <>
              {/* Hasil Perhitungan */}
              <div className="mb-6">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-red-600/80 via-orange-600/80 to-yellow-600/80 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10">
                    <h2 className="text-lg sm:text-xl font-bold text-white">Hasil Perhitungan Dataset Makanan</h2>
                  </div>

                  {/* Langkah 1 */}
                  <div className="p-4 sm:p-6 border-b border-white/10">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Langkah 1 — Menghitung Probabilitas Kelas</h3>

                    {/* Banner Penjelasan */}
                    <div className="bg-indigo-500/10 border-l-4 border-indigo-400 rounded-r-lg p-3 mb-4">
                      <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                        <strong className="text-indigo-300">📚 Apa yang dihitung di sini?</strong><br />
                        Mengukur seberapa banyak makanan <strong>"Boleh"</strong> dan <strong>"Tidak Boleh"</strong> di dataset training.
                        Ini menjadi probabilitas dasar (prior probability) untuk klasifikasi.
                      </p>
                      <p className="text-white/70 text-xs mt-2 font-mono bg-black/20 p-2 rounded">
                        <strong>Rumus:</strong> P(Kelas) = Jumlah makanan kelas ÷ Total seluruh makanan
                      </p>
                    </div>

                    {/* Tabel detail perhitungan */}
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full min-w-max">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-3 py-2 text-left text-white/70 text-xs">Kelas</th>
                            <th className="px-3 py-2 text-center text-white/70 text-xs">Jumlah Makanan</th>
                            <th className="px-3 py-2 text-center text-white/70 text-xs">Total Data</th>
                            <th className="px-3 py-2 text-center text-white/70 text-xs">Perhitungan</th>
                            <th className="px-3 py-2 text-center text-white/70 text-xs">P(Kelas)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          <tr className="hover:bg-white/5">
                            <td className="px-3 py-2 text-green-400 text-xs font-bold">Boleh</td>
                            <td className="px-3 py-2 text-center text-white/80 text-xs">{hasilPerhitungan.makanan.countBoleh}</td>
                            <td className="px-3 py-2 text-center text-white/80 text-xs">{hasilPerhitungan.makanan.totalData}</td>
                            <td className="px-3 py-2 text-center text-white/80 text-xs font-mono">{hasilPerhitungan.makanan.countBoleh} ÷ {hasilPerhitungan.makanan.totalData}</td>
                            <td className="px-3 py-2 text-center text-green-400 text-xs font-mono font-bold">{hasilPerhitungan.makanan.probabilitasKelas.Boleh.toFixed(4)}</td>
                          </tr>
                          <tr className="hover:bg-white/5">
                            <td className="px-3 py-2 text-red-400 text-xs font-bold">Tidak Boleh</td>
                            <td className="px-3 py-2 text-center text-white/80 text-xs">{hasilPerhitungan.makanan.countTidakBoleh}</td>
                            <td className="px-3 py-2 text-center text-white/80 text-xs">{hasilPerhitungan.makanan.totalData}</td>
                            <td className="px-3 py-2 text-center text-white/80 text-xs font-mono">{hasilPerhitungan.makanan.countTidakBoleh} ÷ {hasilPerhitungan.makanan.totalData}</td>
                            <td className="px-3 py-2 text-center text-red-400 text-xs font-mono font-bold">{hasilPerhitungan.makanan.probabilitasKelas.TidakBoleh.toFixed(4)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Ringkasan card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Boleh",       prob: hasilPerhitungan.makanan.probabilitasKelas.Boleh,      count: hasilPerhitungan.makanan.countBoleh,      color: "green" },
                        { label: "Tidak Boleh", prob: hasilPerhitungan.makanan.probabilitasKelas.TidakBoleh, count: hasilPerhitungan.makanan.countTidakBoleh, color: "red"   },
                      ].map(({ label, prob, count, color }) => (
                        <div key={label} className="bg-white/5 p-3 sm:p-4 rounded-lg">
                          <p className="text-white/70 text-sm">P({label})</p>
                          <p className={`text-xl sm:text-2xl font-bold text-${color}-400`}>
                            {prob.toFixed(4)} <span className="text-sm ml-1">({(prob * 100).toFixed(1)}%)</span>
                          </p>
                          <p className="text-xs text-white/50 mt-1">{count} dari {hasilPerhitungan.makanan.totalData} data</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Langkah 2 */}
                  <div className="p-4 sm:p-6 border-b border-white/10">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Langkah 2 — Menghitung Probabilitas Atribut</h3>

                    {/* Banner Penjelasan */}
                    <div className="bg-indigo-500/10 border-l-4 border-indigo-400 rounded-r-lg p-3 mb-4">
                      <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                        <strong className="text-indigo-300">📚 Apa yang dihitung di sini?</strong><br />
                        Untuk setiap nilai atribut (contoh: <em>Kalori Tinggi = Ya</em>), sistem menghitung seberapa sering nilai itu muncul di kelas <strong>"Boleh"</strong> dan kelas <strong>"Tidak Boleh"</strong>.
                      </p>
                      <p className="text-white/70 text-xs mt-2 font-mono bg-black/20 p-2 rounded">
                        <strong>Rumus:</strong> P(Atribut=nilai | Kelas) = Jumlah kemunculan nilai pada kelas ÷ Jumlah total makanan kelas
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-3 py-2 text-left text-white/70 text-xs">Atribut</th>
                            <th className="px-3 py-2 text-left text-white/70 text-xs">Nilai</th>
                            <th className="px-3 py-2 text-center text-white/70 text-xs">Jml di "Boleh"</th>
                            <th className="px-3 py-2 text-center text-white/70 text-xs">Perhitungan</th>
                            <th className="px-3 py-2 text-center text-white/70 text-xs">P(Attr | Boleh)</th>
                            <th className="px-3 py-2 text-center text-white/70 text-xs">Jml di "Tidak Boleh"</th>
                            <th className="px-3 py-2 text-center text-white/70 text-xs">Perhitungan</th>
                            <th className="px-3 py-2 text-center text-white/70 text-xs">P(Attr | Tidak Boleh)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {Object.entries(hasilPerhitungan.makanan.probabilitasAtribut).map(([attr, vals]) => {
                            const sortedSubsets = Object.entries(vals.Boleh).sort((a, b) => {
                              if (a[0] === "Ya" && b[0] === "Tidak") return -1;
                              if (a[0] === "Tidak" && b[0] === "Ya") return 1;
                              return 0;
                            });
                            return sortedSubsets.map((subset, i) => {
                              const pBoleh = subset[1];
                              const pTidakBoleh = vals.TidakBoleh[subset[0]] ?? 0;
                              const jmlBoleh = Math.round(pBoleh * hasilPerhitungan.makanan.countBoleh);
                              const jmlTidakBoleh = Math.round(pTidakBoleh * hasilPerhitungan.makanan.countTidakBoleh);
                              return (
                                <tr key={`${attr}-${subset[0]}`} className="hover:bg-white/5">
                                  <td className="px-3 py-2 text-white/90 text-xs font-semibold">{i === 0 ? attr : ""}</td>
                                  <td className="px-3 py-2 text-white/80 text-xs">{subset[0]}</td>
                                  <td className="px-3 py-2 text-center text-white/80 text-xs">{jmlBoleh}</td>
                                  <td className="px-3 py-2 text-center text-white/70 text-xs font-mono">{jmlBoleh} ÷ {hasilPerhitungan.makanan.countBoleh}</td>
                                  <td className="px-3 py-2 text-center text-green-400 text-xs font-mono font-bold">{pBoleh.toFixed(4)}</td>
                                  <td className="px-3 py-2 text-center text-white/80 text-xs">{jmlTidakBoleh}</td>
                                  <td className="px-3 py-2 text-center text-white/70 text-xs font-mono">{jmlTidakBoleh} ÷ {hasilPerhitungan.makanan.countTidakBoleh}</td>
                                  <td className="px-3 py-2 text-center text-red-400 text-xs font-mono font-bold">{pTidakBoleh.toFixed(4)}</td>
                                </tr>
                              );
                            });
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Langkah 3 */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Langkah 3 — Tabel Pembuktian Prediksi (Validasi Model)</h3>

                    {/* Banner Penjelasan */}
                    <div className="bg-amber-500/10 border-l-4 border-amber-400 rounded-r-lg p-3 mb-4">
                      <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                        <strong className="text-amber-300">📚 Apa fungsi tabel ini?</strong><br />
                        Sistem menguji setiap makanan dengan algoritma Naive Bayes, lalu membandingkan prediksinya dengan fakta yang tercatat.
                        Tujuannya untuk <strong>mengukur akurasi model</strong>.
                      </p>
                      <p className="text-white/70 text-xs mt-2 font-mono bg-black/20 p-2 rounded">
                        <strong>Rumus:</strong> P(Kelas | Data) = P(Kelas) × P(Attr₁|Kelas) × P(Attr₂|Kelas) × ... → kelas dengan nilai tertinggi = hasil prediksi
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-2 py-2 text-left text-white/70 text-xs">No</th>
                            {hasilPerhitungan.makanan.atribut.map(attr => (
                              <th key={attr} className="px-2 py-2 text-left text-white/70 text-xs">Nilai {attr}</th>
                            ))}
                            <th className="px-2 py-2 text-left text-white/70 text-xs">Rumus P(Boleh)</th>
                            <th className="px-2 py-2 text-left text-white/70 text-xs">Hasil P(Boleh)</th>
                            <th className="px-2 py-2 text-left text-white/70 text-xs">Rumus P(Tidak Boleh)</th>
                            <th className="px-2 py-2 text-left text-white/70 text-xs">Hasil P(Tidak Boleh)</th>
                            <th className="px-2 py-2 text-left text-white/70 text-xs">Fakta</th>
                            <th className="px-2 py-2 text-left text-white/70 text-xs">Klasifikasi</th>
                            <th className="px-2 py-2 text-left text-white/70 text-xs">Prediksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {hasilPerhitungan.makanan.prediksi.map(pred => (
                            <tr key={pred.no} className="hover:bg-white/5">
                              <td className="px-2 py-2 text-white/80 text-xs">{pred.no}</td>
                              {hasilPerhitungan.makanan.atribut.map(attr => (
                                <td key={attr} className="px-2 py-2 text-white/80 text-xs">{pred.data?.[attr] || "-"}</td>
                              ))}
                              <td className="px-2 py-2 text-white/60 text-xs font-mono whitespace-nowrap">{pred.rumusBoleh}</td>
                              <td className="px-2 py-2 text-green-400 text-xs font-mono font-bold">{pred.probBoleh.toFixed(6)}</td>
                              <td className="px-2 py-2 text-white/60 text-xs font-mono whitespace-nowrap">{pred.rumusTidakBoleh}</td>
                              <td className="px-2 py-2 text-red-400 text-xs font-mono font-bold">{pred.probTidakBoleh.toFixed(6)}</td>
                              <td className="px-2 py-2 text-white/80 text-xs">{pred.kategoriAktual}</td>
                              <td className="px-2 py-2 text-white/80 text-xs font-semibold">{pred.klasifikasi}</td>
                              <td className="px-2 py-2">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${pred.prediksiSesuai === "SESUAI" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                  {pred.prediksiSesuai}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Ringkasan Akurasi */}
                    {(() => {
                      const total  = hasilPerhitungan.makanan.prediksi.length;
                      const sesuai = hasilPerhitungan.makanan.prediksi.filter(p => p.prediksiSesuai === "SESUAI").length;
                      const tdkSesuai = total - sesuai;
                      const akurasi = total > 0 ? (sesuai / total) * 100 : 0;
                      return (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/30 rounded-xl p-4">
                            <p className="text-white/70 text-xs mb-1">Total Makanan Diuji</p>
                            <p className="text-white text-2xl font-bold">{total}</p>
                          </div>
                          <div className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 border border-green-500/30 rounded-xl p-4">
                            <p className="text-white/70 text-xs mb-1">Prediksi SESUAI</p>
                            <p className="text-green-400 text-2xl font-bold">{sesuai}</p>
                          </div>
                          <div className="bg-gradient-to-br from-red-600/30 to-rose-600/30 border border-red-500/30 rounded-xl p-4">
                            <p className="text-white/70 text-xs mb-1">Prediksi TIDAK SESUAI</p>
                            <p className="text-red-400 text-2xl font-bold">{tdkSesuai}</p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/30 rounded-xl p-4">
                            <p className="text-white/70 text-xs mb-1">Akurasi Model</p>
                            <p className="text-purple-300 text-2xl font-bold">{akurasi.toFixed(1)}%</p>
                            <p className="text-white/50 text-xs mt-0.5 font-mono">{sesuai}/{total}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Hasil Akhir */}
              <div className="mb-6">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600/80 via-pink-600/80 to-rose-600/80 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <FaTable className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-white">Hasil Akhir Klasifikasi Makanan</h2>
                        <p className="text-sm text-white/80">Perbandingan hasil prediksi makanan boleh dan tidak boleh</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-4 py-3 text-left text-white/70 text-sm">Makanan</th>
                            <th className="px-4 py-3 text-left text-white/70 text-sm">Kategori</th>
                            <th className="px-4 py-3 text-center text-white/70 text-sm">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {hasilPerhitungan.hasilAkhir.map((h, i) => (
                            <tr key={i} className="hover:bg-white/5">
                              <td className="px-4 py-3 text-white/90 text-sm">{h.namaMakanan}</td>
                              <td className="px-4 py-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${h.kategori === "Boleh" ? "bg-green-500/20 text-green-400 border border-green-400/30" : "bg-orange-500/20 text-orange-400 border border-orange-400/30"}`}>
                                  {h.kategori}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {h.kategori === "Tidak Boleh"
                                  ? <FaExclamationTriangle className="w-5 h-5 text-orange-400 mx-auto" />
                                  : <FaCheckCircle className="w-5 h-5 text-green-400 mx-auto" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Total Boleh",       val: hasilPerhitungan.hasilAkhir.filter(h => h.kategori === "Boleh").length,       color: "green"  },
                        { label: "Total Tidak Boleh", val: hasilPerhitungan.hasilAkhir.filter(h => h.kategori === "Tidak Boleh").length, color: "orange" },
                      ].map(({ label, val, color }) => (
                        <div key={label} className={`bg-${color}-500/10 border border-${color}-400/30 rounded-lg p-4`}>
                          <p className={`text-${color}-400 text-sm`}>{label}</p>
                          <p className="text-2xl font-bold text-white">{val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tombol-tombol aksi */}
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                      <button onClick={saveHasilAkhirToDatabase}
                        className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-xl shadow-green-500/25 transition-all duration-300 transform hover:scale-105">
                        <div className="relative flex items-center gap-2">
                          <FaSave className="w-4 h-4" />
                          <span className="text-sm">Simpan Hasil</span>
                        </div>
                      </button>

                      <button onClick={exportExcel}
                        className="group relative overflow-hidden bg-gradient-to-r from-emerald-700 to-green-800 hover:from-emerald-800 hover:to-green-900 text-white font-bold py-2.5 px-5 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="relative flex items-center gap-2">
                          <FaFileExcel className="w-4 h-4" />
                          <span className="text-sm">Download Excel</span>
                        </div>
                      </button>

                      <button onClick={exportPDF}
                        className="group relative overflow-hidden bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-800 hover:to-rose-900 text-white font-bold py-2.5 px-5 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="relative flex items-center gap-2">
                          <FaFilePdf className="w-4 h-4" />
                          <span className="text-sm">Download PDF</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerhitunganMakanan;
