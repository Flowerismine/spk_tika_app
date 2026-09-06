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

const PerhitunganPasien = () => {
  const [kriteriaDefisit, setKriteriaDefisit] = useState([]);
  const [kriteriaSurplus, setKriteriaSurplus] = useState([]);
  const [datasetDefisit, setDatasetDefisit] = useState([]);
  const [datasetSurplus, setDatasetSurplus] = useState([]);
  const [hasilPerhitungan, setHasilPerhitungan] = useState(null);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => { dispatch(getMe()); }, [dispatch]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Kita masih butuh kriteria dan dataset mentah untuk dirender di tabel atas
      getKriteriaDefisit(); getKriteriaSurplus();
      getDatasetDefisit(); getDatasetSurplus();
    } else { navigate("/"); }
  }, [navigate]);

  const fetchData = async (url, setter) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setter(res.data);
    } catch (e) { console.error(e); }
  };

  const getKriteriaDefisit  = () => fetchData(`${API_URL}/kriteria-defisit`,  setKriteriaDefisit);
  const getKriteriaSurplus  = () => fetchData(`${API_URL}/kriteria-surplus`,  setKriteriaSurplus);
  const getDatasetDefisit   = () => fetchData(`${API_URL}/dataset-defisit`,   setDatasetDefisit);
  const getDatasetSurplus   = () => fetchData(`${API_URL}/dataset-surplus`,   setDatasetSurplus);

  const handleHitungKlasifikasi = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/hitung-pasien`, { headers: { Authorization: `Bearer ${token}` } });
      setHasilPerhitungan(res.data);
    } catch (e) {
      console.error(e);
      alert("Gagal menghitung klasifikasi pasien: " + (e.response?.data?.msg || e.message));
    } finally {
      setLoading(false);
    }
  };

  // ─── EXPORT EXCEL ────────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (!hasilPerhitungan) return;
    const wb = XLSX.utils.book_new();

    // Styling helpers
    const styleHeader = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4338CA" } }, alignment: { horizontal: "center", wrapText: true }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleSubHeader = { font: { bold: true }, fill: { fgColor: { rgb: "E0E7FF" } }, alignment: { horizontal: "center", wrapText: true }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleCell = { alignment: { horizontal: "center", wrapText: true }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleYa    = { font: { bold: true, color: { rgb: "15803D" } }, fill: { fgColor: { rgb: "DCFCE7" } }, alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleTidak = { font: { bold: true, color: { rgb: "B91C1C" } }, fill: { fgColor: { rgb: "FEE2E2" } }, alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleSesuai    = { font: { bold: true, color: { rgb: "15803D" } }, fill: { fgColor: { rgb: "DCFCE7" } }, alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
    const styleTidakSesuai = { font: { bold: true, color: { rgb: "B91C1C" } }, fill: { fgColor: { rgb: "FEE2E2" } }, alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };

    const applyStyle = (ws, cellAddr, style) => {
      if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
      ws[cellAddr].s = style;
    };

    const buildSheets = (hasil, label, namaKelas1 = "Ya", namaKelas2 = "Tidak") => {

      // ── SHEET 1: Dataset Training ──────────────────────────────────────────
      const dsHeader = ["No", ...hasil.atribut, "Status (Main)"];
      const dsRows   = [dsHeader];
      hasil.prediksi.forEach(p => {
        const row = [p.no, ...hasil.atribut.map(a => p.data?.[a] || "-"), p.mainAktual];
        dsRows.push(row);
      });
      const wsDs = XLSX.utils.aoa_to_sheet(dsRows);
      dsHeader.forEach((_, ci) => applyStyle(wsDs, XLSX.utils.encode_cell({ r: 0, c: ci }), styleHeader));
      wsDs["!cols"] = dsHeader.map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(wb, wsDs, `${label} - 1. Dataset`);

      // ── SHEET 2: Langkah 1 — Probabilitas Kelas ───────────────────────────
      const klsRows = [
        [`LANGKAH 1 — PROBABILITAS KELAS (Dataset ${label})`, "", "", "", ""],
        ["", "", "", "", ""],
        ["Rumus:", "P(Kelas) = Jumlah data kelas / Total data", "", "", ""],
        ["", "", "", "", ""],
        ["Kelas", "Jumlah Data Kelas", "Total Data", "Perhitungan", "P(Kelas)"],
        [namaKelas1, hasil.countYa,    hasil.totalData, `${hasil.countYa} / ${hasil.totalData}`, +hasil.probabilitasKelas.Ya.toFixed(6)],
        [namaKelas2, hasil.countTidak, hasil.totalData, `${hasil.countTidak} / ${hasil.totalData}`, +hasil.probabilitasKelas.Tidak.toFixed(6)],
      ];
      const wsKls = XLSX.utils.aoa_to_sheet(klsRows);
      [0,1,2,3,4].forEach(ci => applyStyle(wsKls, XLSX.utils.encode_cell({ r: 4, c: ci }), styleHeader));
      applyStyle(wsKls, XLSX.utils.encode_cell({ r: 5, c: 4 }), styleYa);
      applyStyle(wsKls, XLSX.utils.encode_cell({ r: 6, c: 4 }), styleTidak);
      wsKls["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } }];
      wsKls["!cols"]   = [{ wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 20 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsKls, `${label} - 2. Prob Kelas`);

      // ── SHEET 3: Langkah 2 — Probabilitas Atribut (dengan jumlah) ─────────
      const atRows = [
        [`LANGKAH 2 — PROBABILITAS ATRIBUT (Dataset ${label})`, "", "", "", "", "", ""],
        ["", "", "", "", "", "", ""],
        ["Rumus:", "P(Atribut=nilai | Kelas) = Jumlah kemunculan nilai pada kelas / Jumlah total data kelas", "", "", "", "", ""],
        ["", "", "", "", "", "", ""],
        ["Atribut", "Nilai", `Jml pada "${namaKelas1}"`, `Total "${namaKelas1}"`, `P(Attr | ${namaKelas1})`, `Jml pada "${namaKelas2}"`, `Total "${namaKelas2}"`, `P(Attr | ${namaKelas2})`],
      ];
      Object.entries(hasil.probabilitasAtribut).forEach(([attr, vals]) => {
        const allVals = [...new Set([...Object.keys(vals.Ya), ...Object.keys(vals.Tidak)])];
        allVals.forEach((val, vi) => {
          const jmlYa    = Math.round((vals.Ya[val]    ?? 0) * hasil.countYa);
          const jmlTidak = Math.round((vals.Tidak[val] ?? 0) * hasil.countTidak);
          atRows.push([
            vi === 0 ? attr : "",
            val,
            jmlYa,    hasil.countYa,    vals.Ya[val]    != null ? `${jmlYa} / ${hasil.countYa} = ${vals.Ya[val].toFixed(6)}`    : "0 / " + hasil.countYa    + " = 0.000000",
            jmlTidak, hasil.countTidak, vals.Tidak[val] != null ? `${jmlTidak} / ${hasil.countTidak} = ${vals.Tidak[val].toFixed(6)}` : "0 / " + hasil.countTidak + " = 0.000000",
          ]);
        });
      });
      const wsAt = XLSX.utils.aoa_to_sheet(atRows);
      [0,1,2,3,4,5,6,7].forEach(ci => applyStyle(wsAt, XLSX.utils.encode_cell({ r: 4, c: ci }), styleHeader));
      wsAt["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 2, c: 1 }, e: { r: 2, c: 7 } },
      ];
      wsAt["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 34 }, { wch: 16 }, { wch: 14 }, { wch: 34 }];
      XLSX.utils.book_append_sheet(wb, wsAt, `${label} - 3. Prob Atribut`);

      // ── SHEET 4: Langkah 3 — Detail Perkalian Per Data ───────────────────
      // Sub-header baris 1: No | Nilai Atribut... | ──── P(Ya) ──── | ──── P(Tidak) ──── | ...
      const subH1 = ["No"];
      hasil.atribut.forEach(a => subH1.push(a, "", "", ""));
      subH1.push("", "", "", "", "Fakta", "Klasifikasi", "Prediksi");

      // Sub-header baris 2: (detail per atribut)
      const subH2 = [""];
      hasil.atribut.forEach(() => subH2.push("Nilai", `P(Attr|${namaKelas1})`, "×", `P(Attr|${namaKelas2})`));
      subH2.push(`P(${namaKelas1})`, `P(${namaKelas2})`, `Akumulasi P(${namaKelas1})`, `Akumulasi P(${namaKelas2})`, "", "", "");

      const pkRows = [subH1, subH2];

      hasil.prediksi.forEach(p => {
        const row = [p.no];
        p.detailFaktor.forEach(f => {
          row.push(f.val, f.pYa.toFixed(6), "×", f.pTidak.toFixed(6));
        });
        row.push(
          hasil.probabilitasKelas.Ya.toFixed(6),
          hasil.probabilitasKelas.Tidak.toFixed(6),
          p.probYa.toFixed(8),
          p.probTidak.toFixed(8),
          p.mainAktual,
          p.klasifikasi,
          p.prediksiSesuai,
        );
        pkRows.push(row);
      });

      const wsPk = XLSX.utils.aoa_to_sheet(pkRows);
      // Style header row 0
      subH1.forEach((_, ci) => applyStyle(wsPk, XLSX.utils.encode_cell({ r: 0, c: ci }), styleHeader));
      subH2.forEach((_, ci) => applyStyle(wsPk, XLSX.utils.encode_cell({ r: 1, c: ci }), styleSubHeader));
      // Style data rows
      hasil.prediksi.forEach((p, ri) => {
        const totalCols = subH1.length;
        for (let ci = 0; ci < totalCols; ci++) applyStyle(wsPk, XLSX.utils.encode_cell({ r: ri + 2, c: ci }), styleCell);
        // Color akumulasi P(Ya) dan P(Tidak)
        const baseCol = 1 + hasil.atribut.length * 4;
        applyStyle(wsPk, XLSX.utils.encode_cell({ r: ri + 2, c: baseCol + 2 }), styleYa);
        applyStyle(wsPk, XLSX.utils.encode_cell({ r: ri + 2, c: baseCol + 3 }), styleTidak);
        // Color prediksi
        const predCol = baseCol + 6;
        applyStyle(wsPk, XLSX.utils.encode_cell({ r: ri + 2, c: predCol }), p.prediksiSesuai === "SESUAI" ? styleSesuai : styleTidakSesuai);
      });
      const colWidths = [{ wch: 5 }];
      hasil.atribut.forEach(() => colWidths.push({ wch: 14 }, { wch: 12 }, { wch: 5 }, { wch: 12 }));
      colWidths.push({ wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 14 });
      wsPk["!cols"] = colWidths;
      XLSX.utils.book_append_sheet(wb, wsPk, `${label} - 4. Detail Perkalian`);

      // ── SHEET 5: Langkah 3 — Ringkasan Pembuktian ─────────────────────────
      const rbHeader = ["No", ...hasil.atribut.map(a => `Nilai ${a}`),
        `Rumus P(${namaKelas1})`, `Hasil P(${namaKelas1})`,
        `Rumus P(${namaKelas2})`, `Hasil P(${namaKelas2})`,
        "Fakta", "Klasifikasi", "Prediksi"];
      const rbRows = [
        [`LANGKAH 3 — RINGKASAN TABEL PEMBUKTIAN (Dataset ${label})`, ...Array(rbHeader.length - 1).fill("")],
        ["", ...Array(rbHeader.length - 1).fill("")],
        rbHeader,
      ];
      hasil.prediksi.forEach(p => {
        const row = [p.no, ...hasil.atribut.map(a => p.data?.[a] || "-"), p.rumusYa, +p.probYa.toFixed(8), p.rumusTidak, +p.probTidak.toFixed(8), p.mainAktual, p.klasifikasi, p.prediksiSesuai];
        rbRows.push(row);
      });
      const wsRb = XLSX.utils.aoa_to_sheet(rbRows);
      rbHeader.forEach((_, ci) => applyStyle(wsRb, XLSX.utils.encode_cell({ r: 2, c: ci }), styleHeader));
      hasil.prediksi.forEach((p, ri) => {
        const r = ri + 3;
        rbHeader.forEach((_, ci) => applyStyle(wsRb, XLSX.utils.encode_cell({ r, c: ci }), styleCell));
        applyStyle(wsRb, XLSX.utils.encode_cell({ r, c: rbHeader.length - 4 }), styleYa);
        applyStyle(wsRb, XLSX.utils.encode_cell({ r, c: rbHeader.length - 2 }), styleTidak);
        applyStyle(wsRb, XLSX.utils.encode_cell({ r, c: rbHeader.length - 1 }), p.prediksiSesuai === "SESUAI" ? styleSesuai : styleTidakSesuai);
      });
      wsRb["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: rbHeader.length - 1 } }];
      wsRb["!cols"]   = [{ wch: 5 }, ...hasil.atribut.map(() => ({ wch: 16 })), { wch: 45 }, { wch: 16 }, { wch: 45 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsRb, `${label} - 5. Ringkasan Tabel`);
    };

    buildSheets(hasilPerhitungan.defisit, "Defisit", "Ya", "Tidak");
    buildSheets(hasilPerhitungan.surplus, "Surplus", "Ya", "Tidak");

    // ── SHEET HASIL AKHIR ──────────────────────────────────────────────────────
    const akhirRows = [
      ["HASIL AKHIR KLASIFIKASI KALORI PASIEN", "", ""],
      ["", "", ""],
      ["No", "Pasien", "Kategori Kalori"],
    ];
    hasilPerhitungan.hasilAkhir.forEach((h, i) => akhirRows.push([i + 1, h.pasien, h.kategori]));
    const wsAkhir = XLSX.utils.aoa_to_sheet(akhirRows);
    [0, 1, 2].forEach(ci => applyStyle(wsAkhir, XLSX.utils.encode_cell({ r: 2, c: ci }), styleHeader));
    hasilPerhitungan.hasilAkhir.forEach((h, i) => {
      const r = i + 3;
      [0, 1, 2].forEach(ci => applyStyle(wsAkhir, XLSX.utils.encode_cell({ r, c: ci }), styleCell));
      const colorStyle = h.kategori === "Defisit Kalori" ? { font: { bold: true, color: { rgb: "C2410C" } }, fill: { fgColor: { rgb: "FED7AA" } }, alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } }
        : h.kategori === "Surplus Kalori" ? { font: { bold: true, color: { rgb: "1D4ED8" } }, fill: { fgColor: { rgb: "DBEAFE" } }, alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } }
        : { font: { bold: true, color: { rgb: "15803D" } }, fill: { fgColor: { rgb: "DCFCE7" } }, alignment: { horizontal: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
      applyStyle(wsAkhir, XLSX.utils.encode_cell({ r, c: 2 }), colorStyle);
    });
    wsAkhir["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    wsAkhir["!cols"]   = [{ wch: 6 }, { wch: 24 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsAkhir, "Hasil Akhir");

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array", cellStyles: true });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "Pembuktian_NaiveBayes_Pasien.xlsx");
  };

  // ─── EXPORT PDF ──────────────────────────────────────────────────────────────
  const exportPDF = () => {
    if (!hasilPerhitungan) return;
    const doc   = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();   // 297 mm landscape
    const pageH = doc.internal.pageSize.getHeight();  // 210 mm landscape
    const ML = 14, MR = 14;  // margin left / right
    const HEADER_COLOR  = [67, 56, 202];   // indigo-700
    const SUBHEAD_COLOR = [99, 102, 241];  // indigo-500
    const GREEN_BG   = [220, 252, 231];
    const GREEN_TEXT = [21, 128, 61];
    const RED_BG     = [254, 226, 226];
    const RED_TEXT   = [185, 28, 28];
    const ORANGE_BG  = [255, 237, 213];
    const BLUE_BG    = [219, 234, 254];

    // ── Helpers ──────────────────────────────────────────────────────────────
    const drawPageHeader = (sectionTitle) => {
      // Top bar
      doc.setFillColor(...HEADER_COLOR);
      doc.rect(0, 0, pageW, 10, "F");
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
      doc.text("PEMBUKTIAN NAÏVE BAYES — KLASIFIKASI PASIEN", ML, 6.5);
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

    const addPageFull = (sectionTitle) => {
      doc.addPage();
      drawPageHeader(sectionTitle);
      drawPageFooter();
    };

    const sectionLabel = { current: "" };

    // Called after every autoTable to patch footers on all pages autoTable may have added
    const patchFooters = () => {
      const total = doc.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        drawPageFooter();
      }
    };

    let y = 14;

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
      const {
        colStyles = {}, headColor = HEADER_COLOR,
        rowColors = null,   // array of { row: i, color: [r,g,b] }
        boldLast  = false,
        smallFont = false,
      } = opts;
      autoTable(doc, {
        startY: y,
        head: [head],
        body,
        styles:      { fontSize: smallFont ? 5.5 : 7, cellPadding: smallFont ? 0.8 : 1.5, valign: "middle", lineColor: [200, 200, 200], lineWidth: 0.2 },
        headStyles:  { fillColor: headColor, textColor: 255, fontStyle: "bold", halign: "center", fontSize: smallFont ? 6 : 7.5 },
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
      if (y > pageH - 20) { addPageFull(sectionLabel.current); y = 14; }
    };

    // ── COVER PAGE ────────────────────────────────────────────────────────────
    doc.setFillColor(...HEADER_COLOR);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PEMBUKTIAN PERHITUNGAN", pageW / 2, 16, { align: "center" });
    doc.setFontSize(16);
    doc.text("NAÏVE BAYES — KLASIFIKASI PASIEN", pageW / 2, 25, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("Sistem Pendukung Keputusan Menu Makanan Bergizi Penderita Diabetes Melitus", pageW / 2, 34, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Summary box
    doc.setFillColor(245, 245, 255);
    doc.roundedRect(ML, 50, pageW - ML - MR, 40, 3, 3, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...HEADER_COLOR);
    doc.text("Ringkasan Dokumen", ML + 5, 58);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
    const summaryLines = [
      `Total Data Defisit  : ${hasilPerhitungan.defisit.totalData} data`,
      `Total Data Surplus  : ${hasilPerhitungan.surplus.totalData} data`,
      `Atribut yang digunakan : ${hasilPerhitungan.defisit.atribut.join(", ")}`,
      `Metode  : Naïve Bayes (Probabilistic Classifier)`,
    ];
    summaryLines.forEach((line, i) => doc.text(line, ML + 5, 65 + i * 7));
    doc.setTextColor(0, 0, 0);

    // Daftar isi
    doc.setFillColor(245, 245, 255);
    doc.roundedRect(ML, 98, pageW - ML - MR, 70, 3, 3, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...HEADER_COLOR);
    doc.text("Daftar Isi", ML + 5, 106);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
    const tocItems = [
      "Halaman 2  — Dataset Defisit Kalori",
      "Halaman 3  — Langkah 1: Probabilitas Kelas (Defisit)",
      "Halaman 3  — Langkah 2: Probabilitas Atribut (Defisit)",
      "Halaman 4  — Langkah 3: Detail Perkalian (Defisit)",
      "Halaman 5  — Dataset Surplus Kalori",
      "Halaman 6  — Langkah 1–2: Probabilitas Kelas & Atribut (Surplus)",
      "Halaman 7  — Langkah 3: Detail Perkalian (Surplus)",
      "Halaman 8  — Hasil Akhir Klasifikasi Kalori Pasien",
    ];
    tocItems.forEach((t, i) => doc.text(t, ML + 5, 113 + i * 7));
    doc.setTextColor(0, 0, 0);

    drawPageFooter();

    // ── SECTION BUILDER ───────────────────────────────────────────────────────
    const buildSection = (hasil, labelSection, namaYa, namaTidak) => {
      sectionLabel.current = labelSection;

      // Page: Dataset
      addPageFull(labelSection);
      y = 14;
      sectionTitle(`Dataset Training — ${labelSection}`);
      rumusNote(`Total data training: ${hasil.totalData} baris`);
      const dsHead = ["No", ...hasil.atribut, "Status (Main)"];
      const dsBody = hasil.prediksi.map(p => [p.no, ...hasil.atribut.map(a => p.data?.[a] || "-"), p.mainAktual]);
      const dsRowColors = hasil.prediksi.map(p => p.mainAktual === namaYa
        ? { bg: GREEN_BG, text: GREEN_TEXT }
        : { bg: RED_BG, text: RED_TEXT }
      );
      addTable(dsHead, dsBody, {
        colStyles: { 0: { halign: "center", cellWidth: 10 } },
        rowColors: dsRowColors,
      });

      // Page: Langkah 1 + Langkah 2
      addPageFull(labelSection);
      y = 14;
      sectionTitle(`Langkah 1 — Probabilitas Kelas (${labelSection})`);
      rumusNote("Rumus: P(Kelas) = Jumlah data kelas / Total data");
      addTable(
        ["Kelas", "Jumlah Data Kelas", "Total Data", "Perhitungan", "P(Kelas)"],
        [
          [namaYa,    hasil.countYa,    hasil.totalData, `${hasil.countYa} / ${hasil.totalData}`,    hasil.probabilitasKelas.Ya.toFixed(6)],
          [namaTidak, hasil.countTidak, hasil.totalData, `${hasil.countTidak} / ${hasil.totalData}`, hasil.probabilitasKelas.Tidak.toFixed(6)],
        ],
        {
          colStyles: { 0: { halign: "center" }, 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" }, 4: { halign: "center", fontStyle: "bold" } },
          rowColors: [{ bg: GREEN_BG, text: GREEN_TEXT }, { bg: RED_BG, text: RED_TEXT }],
        }
      );

      sectionTitle(`Langkah 2 — Probabilitas Atribut (${labelSection})`);
      rumusNote("Rumus: P(Atribut=nilai | Kelas) = Jumlah kemunculan nilai pada kelas / Jumlah total data kelas");
      const attrHead = ["Atribut", "Nilai", `Jml pada "${namaYa}"`, `Total "${namaYa}"`, `P(Attr | ${namaYa})`, `Jml pada "${namaTidak}"`, `Total "${namaTidak}"`, `P(Attr | ${namaTidak})`];
      const attrBody = [];
      Object.entries(hasil.probabilitasAtribut).forEach(([attr, vals]) => {
        const allVals = [...new Set([...Object.keys(vals.Ya), ...Object.keys(vals.Tidak)])];
        allVals.forEach((val, vi) => {
          const jmlYa    = Math.round((vals.Ya[val]    ?? 0) * hasil.countYa);
          const jmlTidak = Math.round((vals.Tidak[val] ?? 0) * hasil.countTidak);
          attrBody.push([
            vi === 0 ? attr : "",
            val,
            jmlYa,    hasil.countYa,    vals.Ya[val]    != null ? `${jmlYa} / ${hasil.countYa} = ${vals.Ya[val].toFixed(4)}`       : `0 / ${hasil.countYa} = 0`,
            jmlTidak, hasil.countTidak, vals.Tidak[val] != null ? `${jmlTidak} / ${hasil.countTidak} = ${vals.Tidak[val].toFixed(4)}` : `0 / ${hasil.countTidak} = 0`,
          ]);
        });
      });
      addTable(attrHead, attrBody, {
        colStyles: {
          0: { fontStyle: "bold", cellWidth: 26 },
          1: { halign: "center", cellWidth: 18 },
          2: { halign: "center", cellWidth: 16 },
          3: { halign: "center", cellWidth: 16 },
          4: { halign: "center", cellWidth: 36 },
          5: { halign: "center", cellWidth: 16 },
          6: { halign: "center", cellWidth: 16 },
          7: { halign: "center" },
        },
      });

      // Page: Langkah 3 — Detail Perkalian
      addPageFull(labelSection);
      y = 14;
      sectionTitle(`Langkah 3 — Detail Perkalian Per Data (${labelSection})`);
      rumusNote(`Rumus: P(posterior) = P(Kelas) × ∏ P(Attr|Kelas)   →   Kelas dengan nilai tertinggi = hasil klasifikasi`);

      const pkHead = [
        "No",
        ...hasil.atribut.flatMap(a => [`Nilai\n${a}`, `P(${a}|${namaYa})`, `P(${a}|${namaTidak})`]),
        `P(${namaYa})`, `P(${namaTidak})`,
        `Akumulasi\nP(${namaYa})`, `Akumulasi\nP(${namaTidak})`,
        "Fakta", "Klasifikasi", "Prediksi",
      ];
      const pkBody = hasil.prediksi.map(p => {
        const row = [p.no];
        p.detailFaktor.forEach(f => row.push(f.val, f.pYa.toFixed(4), f.pTidak.toFixed(4)));
        row.push(
          hasil.probabilitasKelas.Ya.toFixed(4),
          hasil.probabilitasKelas.Tidak.toFixed(4),
          p.probYa.toFixed(6),
          p.probTidak.toFixed(6),
          p.mainAktual,
          p.klasifikasi,
          p.prediksiSesuai,
        );
        return row;
      });

      const akumYaCol  = 1 + hasil.atribut.length * 3 + 2;
      const akumTdkCol = akumYaCol + 1;
      const pkColStyles = { 0: { halign: "center", cellWidth: 6 } };
      hasil.atribut.forEach((_, i) => {
        pkColStyles[1 + i * 3]     = { halign: "center", cellWidth: 11 };
        pkColStyles[1 + i * 3 + 1] = { halign: "center", cellWidth: 11, textColor: GREEN_TEXT };
        pkColStyles[1 + i * 3 + 2] = { halign: "center", cellWidth: 11, textColor: RED_TEXT };
      });
      pkColStyles[akumYaCol - 2]  = { halign: "center", cellWidth: 10 };
      pkColStyles[akumYaCol - 1]  = { halign: "center", cellWidth: 10 };
      pkColStyles[akumYaCol]      = { halign: "center", cellWidth: 14, fontStyle: "bold", textColor: GREEN_TEXT };
      pkColStyles[akumTdkCol]     = { halign: "center", cellWidth: 14, fontStyle: "bold", textColor: RED_TEXT };
      pkColStyles[akumTdkCol + 1] = { halign: "center", cellWidth: 10 };
      pkColStyles[akumTdkCol + 2] = { halign: "center", cellWidth: 13, fontStyle: "bold" };

      addTable(pkHead, pkBody, { colStyles: pkColStyles, boldLast: true, smallFont: true });

      // Ringkasan Pembuktian (tabel rekap per baris)
      if (y > pageH - 50) { addPageFull(labelSection); y = 14; }
      sectionTitle(`Ringkasan Pembuktian — ${labelSection}`, true);
      rumusNote("Tabel ini merangkum rumus perkalian lengkap, hasil akhir probabilitas, dan keputusan klasifikasi per data.");
      const rbHead = ["No", ...hasil.atribut.map(a => `Nilai ${a}`),
        `Rumus P(${namaYa})`, `P(${namaYa})`,
        `Rumus P(${namaTidak})`, `P(${namaTidak})`,
        "Fakta", "Klasifikasi", "Prediksi"];
      const rbBody = hasil.prediksi.map(p => [
        p.no,
        ...hasil.atribut.map(a => p.data?.[a] || "-"),
        p.rumusYa, p.probYa.toFixed(6),
        p.rumusTidak, p.probTidak.toFixed(6),
        p.mainAktual, p.klasifikasi, p.prediksiSesuai,
      ]);
      const rbCols = { 0: { halign: "center", cellWidth: 6 } };
      hasil.atribut.forEach((_, i) => { rbCols[i + 1] = { halign: "center", cellWidth: 16 }; });
      const base = 1 + hasil.atribut.length;
      rbCols[base]     = { cellWidth: 44 };
      rbCols[base + 1] = { halign: "center", cellWidth: 14, fontStyle: "bold", textColor: GREEN_TEXT };
      rbCols[base + 2] = { cellWidth: 44 };
      rbCols[base + 3] = { halign: "center", cellWidth: 14, fontStyle: "bold", textColor: RED_TEXT };
      rbCols[base + 4] = { halign: "center", cellWidth: 10 };
      rbCols[base + 5] = { halign: "center", cellWidth: 14, fontStyle: "bold" };
      addTable(rbHead, rbBody, { colStyles: rbCols, boldLast: true, smallFont: true });
    };

    // ── RENDER SECTIONS ───────────────────────────────────────────────────────
    buildSection(hasilPerhitungan.defisit, "Defisit Kalori",  "Ya", "Tidak");
    buildSection(hasilPerhitungan.surplus, "Surplus Kalori",  "Ya", "Tidak");

    // ── HASIL AKHIR ───────────────────────────────────────────────────────────
    sectionLabel.current = "Hasil Akhir";
    addPageFull("Hasil Akhir");
    y = 14;
    sectionTitle("Hasil Akhir Klasifikasi Kalori Pasien");
    rumusNote("Kategori ditentukan berdasarkan klasifikasi tertinggi dari dataset Defisit dan Surplus.");

    const hasilRowColors = hasilPerhitungan.hasilAkhir.map(h =>
      h.kategori === "Defisit Kalori" ? { bg: ORANGE_BG, text: [194, 65, 12] }
      : h.kategori === "Surplus Kalori" ? { bg: BLUE_BG,   text: [29, 78, 216] }
      : { bg: GREEN_BG, text: GREEN_TEXT }
    );
    addTable(
      ["No", "Pasien", "Kategori Kalori"],
      hasilPerhitungan.hasilAkhir.map((h, i) => [i + 1, h.pasien, h.kategori]),
      {
        colStyles: { 0: { halign: "center", cellWidth: 12 }, 1: { cellWidth: 80 }, 2: { halign: "center", fontStyle: "bold" } },
        rowColors: hasilRowColors,
      }
    );

    // Statistik ringkasan
    const defisitCount = hasilPerhitungan.hasilAkhir.filter(h => h.kategori === "Defisit Kalori").length;
    const surplusCount = hasilPerhitungan.hasilAkhir.filter(h => h.kategori === "Surplus Kalori").length;
    const normalCount  = hasilPerhitungan.hasilAkhir.filter(h => h.kategori === "Kalori Normal").length;
    if (y + 30 < pageH - 15) {
      doc.setFillColor(245, 245, 255);
      doc.roundedRect(ML, y, pageW - ML - MR, 28, 2, 2, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...HEADER_COLOR);
      doc.text("Statistik Hasil Klasifikasi", ML + 4, y + 7);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
      doc.text(`Defisit Kalori  : ${defisitCount} pasien`, ML + 4, y + 14);
      doc.text(`Surplus Kalori  : ${surplusCount} pasien`, ML + 4, y + 20);
      doc.text(`Kalori Normal   : ${normalCount} pasien`,  ML + 4, y + 26);
      doc.setTextColor(0, 0, 0);
    }

    // Patch all footers & page numbers
    patchFooters();

    doc.save("Pembuktian_NaiveBayes_Pasien.pdf");
  };

  // ─── SAVE TO DB ──────────────────────────────────────────────────────────────
  const saveHasilAkhirToDatabase = async () => {
    if (!hasilPerhitungan?.hasilAkhir) { alert("Tidak ada data untuk disimpan."); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      await axios.delete(`${API_URL}/hasil-akhir-pasien?confirm=true&tipe=training`, { headers });
      await axios.post(`${API_URL}/hasil-akhir-pasien`,
        { hasilAkhirPasien: hasilPerhitungan.hasilAkhir.map(i => ({ namaPasien: i.pasien, kategori: i.kategori, tipe: 'training' })) },
        { headers }
      );
      alert("Hasil akhir pembuktian training berhasil disimpan ke database!");
    } catch (e) {
      alert(`Error menyimpan: ${e.response?.data?.msg || e.message}`);
    } finally { setLoading(false); }
  };

  // ─── RENDER HELPERS ──────────────────────────────────────────────────────────
  const CardHeader = ({ gradient, icon, title, subtitle }) => (
    <div className={`bg-gradient-to-r ${gradient} backdrop-blur-sm p-4 sm:p-6 border-b border-white/10`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center">{icon}</div>
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">{title}</h2>
          {subtitle && <p className="text-sm sm:text-base text-white/80">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const DatasetTable = ({ kriteria, dataset, title }) => (
    <div className="mb-6">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
        <CardHeader gradient="from-indigo-600/80 via-purple-600/80 to-blue-600/80"
          icon={<FaChartLine className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
          title={title} subtitle="Data yang akan digunakan untuk klasifikasi" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-white/70 uppercase">No</th>
                {kriteria.map(k => (
                  <th key={k.id} className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-white/70 uppercase min-w-[120px]">
                    {k.namaKriteria}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {dataset.map((item, i) => (
                <tr key={item.id} className="hover:bg-white/5">
                  <td className="px-3 sm:px-6 py-3 text-white font-medium text-sm">{i + 1}</td>
                  {kriteria.map(k => (
                    <td key={k.id} className="px-3 sm:px-6 py-3 text-white/80 text-sm">{item.nilai?.[k.namaKriteria] || "-"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const HasilSection = ({ hasil, datasetCount, labelYa = "Ya", labelTidak = "Tidak", gradient, title }) => (
    <div className="mb-6">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
        <div className={`bg-gradient-to-r ${gradient} backdrop-blur-sm p-4 sm:p-6 border-b border-white/10`}>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{title}</h2>
        </div>

        {/* Langkah 1: Probabilitas Kelas */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Langkah 1 — Menghitung Probabilitas Kelas</h3>

          {/* Banner Penjelasan */}
          <div className="bg-indigo-500/10 border-l-4 border-indigo-400 rounded-r-lg p-3 mb-4">
            <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
              <strong className="text-indigo-300">📚 Apa yang dihitung di sini?</strong><br />
              Mengukur seberapa banyak data <strong>"{labelYa}"</strong> dan <strong>"{labelTidak}"</strong> di dataset training.
              Ini menjadi probabilitas dasar (prior probability) untuk klasifikasi.
            </p>
            <p className="text-white/70 text-xs mt-2 font-mono bg-black/20 p-2 rounded">
              <strong>Rumus:</strong> P(Kelas) = Jumlah data kelas ÷ Total seluruh data
            </p>
          </div>

          {/* Tabel detail perhitungan */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full min-w-max">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-3 py-2 text-left text-white/70 text-xs">Kelas</th>
                  <th className="px-3 py-2 text-center text-white/70 text-xs">Jumlah Data Kelas</th>
                  <th className="px-3 py-2 text-center text-white/70 text-xs">Total Data</th>
                  <th className="px-3 py-2 text-center text-white/70 text-xs">Perhitungan</th>
                  <th className="px-3 py-2 text-center text-white/70 text-xs">P(Kelas)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr className="hover:bg-white/5">
                  <td className="px-3 py-2 text-green-400 text-xs font-bold">{labelYa}</td>
                  <td className="px-3 py-2 text-center text-white/80 text-xs">{hasil.countYa}</td>
                  <td className="px-3 py-2 text-center text-white/80 text-xs">{hasil.totalData}</td>
                  <td className="px-3 py-2 text-center text-white/80 text-xs font-mono">{hasil.countYa} ÷ {hasil.totalData}</td>
                  <td className="px-3 py-2 text-center text-green-400 text-xs font-mono font-bold">{hasil.probabilitasKelas.Ya.toFixed(4)}</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="px-3 py-2 text-red-400 text-xs font-bold">{labelTidak}</td>
                  <td className="px-3 py-2 text-center text-white/80 text-xs">{hasil.countTidak}</td>
                  <td className="px-3 py-2 text-center text-white/80 text-xs">{hasil.totalData}</td>
                  <td className="px-3 py-2 text-center text-white/80 text-xs font-mono">{hasil.countTidak} ÷ {hasil.totalData}</td>
                  <td className="px-3 py-2 text-center text-red-400 text-xs font-mono font-bold">{hasil.probabilitasKelas.Tidak.toFixed(4)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ringkasan card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: labelYa,    prob: hasil.probabilitasKelas.Ya,    count: hasil.countYa,    color: "green" },
              { label: labelTidak, prob: hasil.probabilitasKelas.Tidak, count: hasil.countTidak, color: "red"   },
            ].map(({ label, prob, count, color }) => (
              <div key={label} className="bg-white/5 p-3 sm:p-4 rounded-lg">
                <p className="text-white/70 text-sm">P({label})</p>
                <p className={`text-xl sm:text-2xl font-bold text-${color}-400`}>
                  {prob.toFixed(4)}
                  <span className="text-sm ml-2">({(prob * 100).toFixed(1)}%)</span>
                </p>
                <p className="text-xs text-white/50 mt-1">{count} dari {hasil.totalData} data</p>
              </div>
            ))}
          </div>
        </div>

        {/* Langkah 2: Probabilitas Atribut */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Langkah 2 — Menghitung Probabilitas Atribut</h3>

          {/* Banner Penjelasan */}
          <div className="bg-indigo-500/10 border-l-4 border-indigo-400 rounded-r-lg p-3 mb-4">
            <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
              <strong className="text-indigo-300">📚 Apa yang dihitung di sini?</strong><br />
              Untuk setiap nilai atribut (contoh: <em>Jenis Kelamin = Pria</em>), sistem menghitung seberapa sering nilai itu muncul di kelas <strong>"{labelYa}"</strong> dan kelas <strong>"{labelTidak}"</strong>.
              Ini disebut <em>likelihood</em> — probabilitas kondisional.
            </p>
            <p className="text-white/70 text-xs mt-2 font-mono bg-black/20 p-2 rounded">
              <strong>Rumus:</strong> P(Atribut=nilai | Kelas) = Jumlah kemunculan nilai pada kelas ÷ Jumlah total data kelas
            </p>
            <p className="text-white/60 text-xs mt-2 italic">
              💡 Contoh: dari {hasil.countYa} data kelas "{labelYa}", jika ada 3 baris dengan "Pria", maka P(Pria | {labelYa}) = 3 ÷ {hasil.countYa} = {(3/Math.max(hasil.countYa,1)).toFixed(4)}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-3 py-2 text-left text-white/70 text-xs">Atribut</th>
                  <th className="px-3 py-2 text-left text-white/70 text-xs">Nilai</th>
                  <th className="px-3 py-2 text-center text-white/70 text-xs">Jml di "{labelYa}"</th>
                  <th className="px-3 py-2 text-center text-white/70 text-xs">Perhitungan</th>
                  <th className="px-3 py-2 text-center text-white/70 text-xs">P(Attr | {labelYa})</th>
                  <th className="px-3 py-2 text-center text-white/70 text-xs">Jml di "{labelTidak}"</th>
                  <th className="px-3 py-2 text-center text-white/70 text-xs">Perhitungan</th>
                  <th className="px-3 py-2 text-center text-white/70 text-xs">P(Attr | {labelTidak})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {Object.entries(hasil.probabilitasAtribut).map(([attr, vals]) => {
                  const allVals = [...new Set([...Object.keys(vals.Ya), ...Object.keys(vals.Tidak)])];
                  return allVals.map((val, i) => {
                    const jmlYa    = Math.round((vals.Ya[val]    ?? 0) * hasil.countYa);
                    const jmlTidak = Math.round((vals.Tidak[val] ?? 0) * hasil.countTidak);
                    return (
                      <tr key={`${attr}-${val}`} className="hover:bg-white/5">
                        <td className="px-3 py-2 text-white/90 text-xs font-semibold">{i === 0 ? attr : ""}</td>
                        <td className="px-3 py-2 text-white/80 text-xs">{val}</td>
                        <td className="px-3 py-2 text-center text-white/80 text-xs">{jmlYa}</td>
                        <td className="px-3 py-2 text-center text-white/70 text-xs font-mono">{jmlYa} ÷ {hasil.countYa}</td>
                        <td className="px-3 py-2 text-center text-green-400 text-xs font-mono font-bold">{vals.Ya[val]?.toFixed(4) ?? "0.0000"}</td>
                        <td className="px-3 py-2 text-center text-white/80 text-xs">{jmlTidak}</td>
                        <td className="px-3 py-2 text-center text-white/70 text-xs font-mono">{jmlTidak} ÷ {hasil.countTidak}</td>
                        <td className="px-3 py-2 text-center text-red-400 text-xs font-mono font-bold">{vals.Tidak[val]?.toFixed(4) ?? "0.0000"}</td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Langkah 3: Tabel Pembuktian */}
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Langkah 3 — Tabel Pembuktian Prediksi (Validasi Model)</h3>

          {/* Banner Penjelasan */}
          <div className="bg-amber-500/10 border-l-4 border-amber-400 rounded-r-lg p-3 mb-4">
            <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
              <strong className="text-amber-300">📚 Apa fungsi tabel ini?</strong><br />
              Sistem menguji setiap baris data training dengan algoritma Naive Bayes, lalu membandingkan prediksinya dengan fakta yang tercatat.
              Tujuannya untuk <strong>mengukur akurasi model</strong> — bukan untuk klasifikasi pasien baru.
            </p>
            <p className="text-white/70 text-xs mt-2 font-mono bg-black/20 p-2 rounded">
              <strong>Rumus:</strong> P(Kelas | Data) = P(Kelas) × P(Attr₁|Kelas) × P(Attr₂|Kelas) × ... → kelas dengan nilai tertinggi = hasil prediksi
            </p>
            <p className="text-white/60 text-xs mt-2 italic">
              💡 SESUAI = prediksi sistem cocok dengan fakta. TIDAK SESUAI = prediksi salah.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-2 py-2 text-left text-white/70 text-xs">No</th>
                  {hasil.atribut.map(attr => (
                    <th key={attr} className="px-2 py-2 text-left text-white/70 text-xs">Nilai {attr}</th>
                  ))}
                  <th className="px-2 py-2 text-left text-white/70 text-xs">Rumus P({labelYa})</th>
                  <th className="px-2 py-2 text-left text-white/70 text-xs">Hasil P({labelYa})</th>
                  <th className="px-2 py-2 text-left text-white/70 text-xs">Rumus P({labelTidak})</th>
                  <th className="px-2 py-2 text-left text-white/70 text-xs">Hasil P({labelTidak})</th>
                  <th className="px-2 py-2 text-left text-white/70 text-xs">Fakta</th>
                  <th className="px-2 py-2 text-left text-white/70 text-xs">Klasifikasi</th>
                  <th className="px-2 py-2 text-left text-white/70 text-xs">Prediksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {hasil.prediksi.map(pred => (
                  <tr key={pred.no} className="hover:bg-white/5">
                    <td className="px-2 py-2 text-white/80 text-xs">{pred.no}</td>
                    {hasil.atribut.map(attr => (
                      <td key={attr} className="px-2 py-2 text-white/80 text-xs">{pred.data?.[attr] || "-"}</td>
                    ))}
                    <td className="px-2 py-2 text-white/60 text-xs font-mono whitespace-nowrap">{pred.rumusYa}</td>
                    <td className="px-2 py-2 text-green-400 text-xs font-mono font-bold">{pred.probYa.toFixed(6)}</td>
                    <td className="px-2 py-2 text-white/60 text-xs font-mono whitespace-nowrap">{pred.rumusTidak}</td>
                    <td className="px-2 py-2 text-red-400 text-xs font-mono font-bold">{pred.probTidak.toFixed(6)}</td>
                    <td className="px-2 py-2 text-white/80 text-xs">{pred.mainAktual}</td>
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
            const total  = hasil.prediksi.length;
            const sesuai = hasil.prediksi.filter(p => p.prediksiSesuai === "SESUAI").length;
            const tdkSesuai = total - sesuai;
            const akurasi = total > 0 ? (sesuai / total) * 100 : 0;
            return (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-white/70 text-xs mb-1">Total Data Diuji</p>
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
  );

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
            <p className="text-sm sm:text-base text-white/70">Analisis Kebutuhan Kalori Pasien</p>
          </div>

          <DatasetTable kriteria={kriteriaDefisit} dataset={datasetDefisit} title="Dataset Pasien Defisit Kalori" />
          <DatasetTable kriteria={kriteriaSurplus} dataset={datasetSurplus} title="Dataset Pasien Surplus Kalori" />

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
              <HasilSection hasil={hasilPerhitungan.defisit}
                gradient="from-red-600/80 via-orange-600/80 to-yellow-600/80"
                title="Hasil Perhitungan Dataset Defisit Kalori" />

              <HasilSection hasil={hasilPerhitungan.surplus}
                gradient="from-blue-600/80 via-cyan-600/80 to-teal-600/80"
                title="Hasil Perhitungan Dataset Surplus Kalori" />

              {/* Hasil Akhir */}
              <div className="mb-6">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden">
                  <CardHeader gradient="from-purple-600/80 via-pink-600/80 to-rose-600/80"
                    icon={<FaTable className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
                    title="Hasil Akhir Klasifikasi Kalori"
                    subtitle="Perbandingan hasil prediksi defisit dan surplus" />
                  <div className="p-4 sm:p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-4 py-3 text-left text-white/70 text-sm">Pasien</th>
                            <th className="px-4 py-3 text-left text-white/70 text-sm">Kategori</th>
                            <th className="px-4 py-3 text-center text-white/70 text-sm">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {hasilPerhitungan.hasilAkhir.map((h, i) => (
                            <tr key={i} className="hover:bg-white/5">
                              <td className="px-4 py-3 text-white/90 text-sm">{h.pasien}</td>
                              <td className="px-4 py-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  h.kategori === "Defisit Kalori" ? "bg-orange-500/20 text-orange-400 border border-orange-400/30"
                                  : h.kategori === "Surplus Kalori" ? "bg-blue-500/20 text-blue-400 border border-blue-400/30"
                                  : "bg-green-500/20 text-green-400 border border-green-400/30"}`}>
                                  {h.kategori}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {h.kategori === "Kalori Normal"
                                  ? <FaCheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                                  : <FaExclamationTriangle className="w-5 h-5 text-orange-400 mx-auto" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: "Total Defisit", val: hasilPerhitungan.hasilAkhir.filter(h => h.kategori === "Defisit Kalori").length,  color: "orange" },
                        { label: "Total Surplus", val: hasilPerhitungan.hasilAkhir.filter(h => h.kategori === "Surplus Kalori").length,  color: "blue"   },
                        { label: "Total Normal",  val: hasilPerhitungan.hasilAkhir.filter(h => h.kategori === "Kalori Normal").length,   color: "green"  },
                      ].map(({ label, val, color }) => (
                        <div key={label} className={`bg-${color}-500/10 border border-${color}-400/30 rounded-lg p-4`}>
                          <p className={`text-${color}-400 text-sm`}>{label}</p>
                          <p className="text-2xl font-bold text-white">{val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Tombol-tombol aksi */}
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                      {/* Simpan DB */}
                      <button onClick={saveHasilAkhirToDatabase} disabled={loading}
                        className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-xl shadow-green-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50">
                        <div className="relative flex items-center gap-2">
                          <FaSave className="w-4 h-4" />
                          <span className="text-sm">{loading ? "Menyimpan..." : "Simpan Hasil"}</span>
                        </div>
                      </button>

                      {/* Download Excel */}
                      <button onClick={exportExcel}
                        className="group relative overflow-hidden bg-gradient-to-r from-emerald-700 to-green-800 hover:from-emerald-800 hover:to-green-900 text-white font-bold py-2.5 px-5 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105">
                        <div className="relative flex items-center gap-2">
                          <FaFileExcel className="w-4 h-4" />
                          <span className="text-sm">Download Excel</span>
                        </div>
                      </button>

                      {/* Download PDF */}
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

export default PerhitunganPasien;
