import API_URL from "../api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getMe } from "../features/authSlice";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

const CetakHasil = () => {
  const [datasetMakanan, setDatasetMakanan] = useState([]);
  const [namaPasien, setNamaPasien] = useState("");
  const [kategori, setKategori] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const rekomendasiMakanan = location.state?.rekomendasiMakanan || [];

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    } else {
      getDatasetMakanan();
      getPasienById();
    }
  }, [navigate, id]);

  const getPasienById = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/hasil-akhir-pasien/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNamaPasien(response.data.namaPasien);
      setKategori(response.data.kategori);
    } catch (error) {
      console.error("Error fetching dataset:", error);
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

  const tanggalSekarang = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const exportToDocx = async () => {
    const borders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    };

    // Membuat rows untuk tabel dataset makanan
    const datasetRows = datasetMakanan.map(
      (item) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(item.nilai["Nama Makanan"] || "")],
              borders,
            }),
            new TableCell({
              children: [new Paragraph(item.nilai["Kategori Makanan"] || "")],
              borders,
            }),
            new TableCell({
              children: [
                new Paragraph(
                  item.nilai["Kalori Tinggi"] === "Ya" ? "Tinggi" : "Rendah"
                ),
              ],
              borders,
            }),
            new TableCell({
              children: [
                new Paragraph(
                  item.nilai["Karbo Tinggi"] === "Ya" ? "Tinggi" : "Rendah"
                ),
              ],
              borders,
            }),
            new TableCell({
              children: [
                new Paragraph(
                  item.nilai["Protein Tinggi"] === "Ya" ? "Tinggi" : "Rendah"
                ),
              ],
              borders,
            }),
            new TableCell({
              children: [
                new Paragraph(
                  item.nilai["Lemak Tinggi"] === "Ya" ? "Tinggi" : "Rendah"
                ),
              ],
              borders,
            }),
            new TableCell({
              children: [
                new Paragraph(
                  item.nilai["IG Tinggi"] === "Ya" ? "Tinggi" : "Rendah"
                ),
              ],
              borders,
            }),
            new TableCell({
              children: [
                new Paragraph(String(item.nilai["Jumlah Kalori"] || "")),
              ],
              borders,
            }),
          ],
        })
    );

    // Membuat rows untuk tabel rekomendasi
    const rekomendasiRows =
      rekomendasiMakanan.length > 0
        ? rekomendasiMakanan.map(
            (item, idx) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph(String(idx + 1))],
                    borders,
                  }),
                  new TableCell({
                    children: [new Paragraph(item.namaMakanan || "")],
                    borders,
                  }),
                  new TableCell({
                    children: [new Paragraph(item.kategori || "")],
                    borders,
                  }),
                  new TableCell({
                    children: [new Paragraph(item.kalori || "")],
                    borders,
                  }),
                  new TableCell({
                    children: [new Paragraph(String(item.jumlahKalori || ""))],
                    borders,
                  }),
                ],
              })
          )
        : [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph(
                      "Tidak ada rekomendasi makanan untuk pasien ini."
                    ),
                  ],
                  borders,
                  columnSpan: 5,
                }),
              ],
            }),
          ];

    // Membuat dokumen Word
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "HASIL REKOMENDASI MAKANAN",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Laporan rekomendasi makanan pasien",
                  size: 20,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: tanggalSekarang, size: 20 })],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Nama Pasien", size: 22 }),
                new TextRun({
                  text: `\t\t: ${namaPasien}`,
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Usia", size: 22 }),
                new TextRun({ text: "\t\t\t: ", size: 22, bold: true }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Alamat", size: 22 }),
                new TextRun({ text: "\t\t\t: ", size: 22, bold: true }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Kategori", size: 22 }),
                new TextRun({
                  text: `\t\t: ${kategori}`,
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "ID", size: 22 }),
                new TextRun({
                  text: `\t\t\t: Pasien-${id}`,
                  size: 22,
                  bold: true,
                }),
              ],
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Daftar Makanan", bold: true, size: 24 }),
              ],
              spacing: { after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ text: "Nama Makanan", bold: true }),
                      ],
                      borders,
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ text: "Kategori", bold: true }),
                      ],
                      borders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: "Kalori", bold: true })],
                      borders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: "Karbo", bold: true })],
                      borders,
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ text: "Protein", bold: true }),
                      ],
                      borders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: "Lemak", bold: true })],
                      borders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: "IG", bold: true })],
                      borders,
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ text: "Jumlah Kalori", bold: true }),
                      ],
                      borders,
                    }),
                  ],
                }),
                ...datasetRows,
              ],
            }),
            new Paragraph({ text: "", spacing: { after: 400 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Rekomendasi Makanan",
                  bold: true,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: "No", bold: true })],
                      borders,
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ text: "Nama Makanan", bold: true }),
                      ],
                      borders,
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ text: "Kategori", bold: true }),
                      ],
                      borders,
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: "Kalori", bold: true })],
                      borders,
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ text: "Jumlah Kalori", bold: true }),
                      ],
                      borders,
                    }),
                  ],
                }),
                ...rekomendasiRows,
              ],
            }),
            new Paragraph({ text: "", spacing: { after: 800 } }),
            new Paragraph({
              children: [
                new TextRun({ text: "Dokter Penanggung Jawab", size: 22 }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 800 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "dr. Dessi Yulianti", bold: true, size: 22 }),
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "SIP. 446.1/045/SIP-D/DPMPTSP/2021", size: 20 }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Rekomendasi-Makanan-Pasien-${id}.docx`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 print:bg-white">
      <div className="max-w-[900px] mx-auto bg-white shadow-lg print:shadow-none print:border-none border border-gray-200 p-8 print:p-6">
        {/* Tombol Cetak (disembunyikan saat print) */}
        <div className="flex justify-end gap-3 mb-4 no-print">
          <button
            onClick={exportToDocx}
            className="inline-flex items-center gap-3 px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-md shadow-md hover:brightness-95 transition"
          >
            Export DOCX
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-3 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-md shadow-md hover:brightness-95 transition"
          >
            Cetak
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">HASIL REKOMENDASI MAKANAN</h1>
            <p className="text-sm text-gray-600">
              Laporan rekomendasi makanan pasien
            </p>
          </div>
          <div className="text-right text-sm text-gray-700">
            <div>{tanggalSekarang}</div>
          </div>
        </div>

        {/* Informasi pasien - tampil vertikal sesuai permintaan */}
        <div className="mb-6 space-y-2 text-sm">
          <div className="flex gap-4 items-start">
            <div className="w-40 text-gray-700 font-semibold">Nama Pasien</div>
            <div className="font-semibold">: {namaPasien}</div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-40 text-gray-700 font-semibold">Usia</div>
            <div className="font-semibold">: </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-40 text-gray-700 font-semibold">Alamat</div>
            <div className="font-semibold">: </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-40 text-gray-700 font-semibold">Kategori</div>
            <div className="font-semibold">: {kategori}</div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-40 text-gray-700 font-semibold">ID</div>
            <div className="font-semibold">: Pasien-{id}</div>
          </div>
        </div>

        {/* Tabel daftar makanan */}
        <div className="mb-8 overflow-x-auto">
          <h2 className="text-sm font-semibold mb-4">Daftar Makanan</h2>
          <table className="w-full border-collapse text-xs mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Nama Makanan</th>
                <th className="border px-3 py-2 text-left">Kategori</th>
                <th className="border px-3 py-2 text-left">Kalori</th>
                <th className="border px-3 py-2 text-left">Karbo</th>
                <th className="border px-3 py-2 text-left">Protein</th>
                <th className="border px-3 py-2 text-left">Lemak</th>
                <th className="border px-3 py-2 text-left">IG</th>
                <th className="border px-3 py-2 text-left">Jumlah Kalori</th>
              </tr>
            </thead>
            <tbody>
              {datasetMakanan.map((item, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border px-3 py-2 align-top">
                    {item.nilai["Nama Makanan"]}
                  </td>
                  <td className="border px-3 py-2 align-top">
                    {item.nilai["Kategori Makanan"]}
                  </td>
                  <td className="border px-3 py-2 align-top">
                    {item.nilai["Kalori Tinggi"] === "Ya" ? "Tinggi" : "Rendah"}
                  </td>
                  <td className="border px-3 py-2 align-top">
                    {item.nilai["Karbo Tinggi"] === "Ya" ? "Tinggi" : "Rendah"}
                  </td>
                  <td className="border px-3 py-2 align-top">
                    {item.nilai["Protein Tinggi"] === "Ya"
                      ? "Tinggi"
                      : "Rendah"}
                  </td>
                  <td className="border px-3 py-2 align-top">
                    {item.nilai["Lemak Tinggi"] === "Ya" ? "Tinggi" : "Rendah"}
                  </td>
                  <td className="border px-3 py-2 align-top">
                    {item.nilai["IG Tinggi"] === "Ya" ? "Tinggi" : "Rendah"}
                  </td>
                  <td className="border px-3 py-2 align-top">
                    {item.nilai["Jumlah Kalori"]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tabel rekomendasi */}
        <div className="mb-8 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Rekomendasi Makanan</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">No</th>
                <th className="border px-3 py-2 text-left">Nama Makanan</th>
                <th className="border px-3 py-2 text-left">Kategori</th>
                <th className="border px-3 py-2 text-left">Kalori</th>
                <th className="border px-3 py-2 text-left">Jumlah Kalori</th>
              </tr>
            </thead>
            <tbody>
              {rekomendasiMakanan.length > 0 ? (
                rekomendasiMakanan.map((item, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border px-3 py-2">{idx + 1}</td>
                    <td className="border px-3 py-2">{item.namaMakanan}</td>
                    <td className="border px-3 py-2">{item.kategori}</td>
                    <td className="border px-3 py-2">{item.kalori}</td>
                    <td className="border px-3 py-2">{item.jumlahKalori}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border px-3 py-6 text-center" colSpan={5}>
                    Tidak ada rekomendasi makanan untuk pasien ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda tangan dokter */}
        <div className="grid grid-cols-1 gap-6 mt-28">
          <div className="text-right">
            <div className="text-sm text-gray-700">Dokter Penanggung Jawab</div>
            <div className="mt-16 text-sm font-semibold">dr. Dessi Yulianti</div>
            <div className="text-xs text-gray-600">SIP. 446.1/045/SIP-D/DPMPTSP/2021</div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default CetakHasil;
