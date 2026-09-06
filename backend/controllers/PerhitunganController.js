const DatasetDefisit = require("../models/DatasetDefisitModel.js");
const KriteriaDefisit = require("../models/KriteriaDefisitModel.js");
const DatasetSurplus = require("../models/DatasetSurplusModel.js");
const KriteriaSurplus = require("../models/KriteriaSurplusModel.js");
const DatasetMakanan = require("../models/DatasetMakananModel.js");
const KriteriaMakanan = require("../models/KriteriaMakananModel.js");

// Fungsi pembantu Naive Bayes dengan Laplace Smoothing
const calculateNaiveBayes = (dataset, kriteria, namaKelas1 = "Ya", namaKelas2 = "Tidak", mainTargetName = "Main") => {
  // Hanya ambil kriteria yang bukan main target
  const atribut = kriteria.filter(k => k.namaKriteria !== mainTargetName).map(k => k.namaKriteria);
  const totalData = dataset.length;

  if (totalData === 0) {
    return { probabilitasKelas: { [namaKelas1]: 0, [namaKelas2]: 0 }, probabilitasAtribut: {}, prediksi: [], atribut, countYa: 0, countTidak: 0, totalData: 0 };
  }

  const countYa = dataset.filter(d => d.nilai?.[mainTargetName] === namaKelas1).length;
  const countTidak = dataset.filter(d => d.nilai?.[mainTargetName] === namaKelas2).length;

  // Probabilitas kelas dasar (tidak butuh smoothing)
  const probabilitasKelas = {
    [namaKelas1]: countYa / totalData,
    [namaKelas2]: countTidak / totalData
  };

  const probabilitasAtribut = {};
  atribut.forEach(attr => {
    probabilitasAtribut[attr] = { [namaKelas1]: {}, [namaKelas2]: {} };
    // Ambil semua kemungkinan unik dari dataset
    const uniqueValues = [...new Set(dataset.map(d => d.nilai?.[attr]))].filter(Boolean);
    const jumlahAtributUnik = uniqueValues.length;

    uniqueValues.forEach(val => {
      const cntYa = dataset.filter(d => d.nilai?.[mainTargetName] === namaKelas1 && d.nilai?.[attr] === val).length;
      const cntTidak = dataset.filter(d => d.nilai?.[mainTargetName] === namaKelas2 && d.nilai?.[attr] === val).length;

      // LAPLACE SMOOTHING: (count + 1) / (totalClassCount + numUniqueValues)
      probabilitasAtribut[attr][namaKelas1][val] = (cntYa + 1) / (countYa + jumlahAtributUnik);
      probabilitasAtribut[attr][namaKelas2][val] = (cntTidak + 1) / (countTidak + jumlahAtributUnik);
    });
  });

  const prediksi = dataset.map((item, index) => {
    const mainAktual = item.nilai?.[mainTargetName];
    let probYa = probabilitasKelas[namaKelas1];
    let probTidak = probabilitasKelas[namaKelas2];

    const detailFaktor = atribut.map(attr => {
      const val = item.nilai?.[attr];
      const pYa = val && probabilitasAtribut[attr][namaKelas1][val] != null ? probabilitasAtribut[attr][namaKelas1][val] : 0;
      const pTidak = val && probabilitasAtribut[attr][namaKelas2][val] != null ? probabilitasAtribut[attr][namaKelas2][val] : 0;
      return { attr, val: val || "-", pYa, pTidak };
    });

    atribut.forEach(attr => {
      const val = item.nilai?.[attr];
      if (val && probabilitasAtribut[attr][namaKelas1][val] != null) {
        probYa *= probabilitasAtribut[attr][namaKelas1][val];
        probTidak *= probabilitasAtribut[attr][namaKelas2][val];
      }
    });

    const rumusYa = [probabilitasKelas[namaKelas1].toFixed(6), ...detailFaktor.map(f => f.pYa.toFixed(6))].join(" × ");
    const rumusTidak = [probabilitasKelas[namaKelas2].toFixed(6), ...detailFaktor.map(f => f.pTidak.toFixed(6))].join(" × ");

    let klasifikasi;
    if (probYa === 0 && probTidak === 0) {
        klasifikasi = namaKelas2;
    } else {
        klasifikasi = probYa > probTidak ? namaKelas1 : namaKelas2;
    }

    const prediksiSesuai = klasifikasi === mainAktual ? "SESUAI" : "TIDAK SESUAI";
    return {
      no: index + 1,
      data: item.nilai,
      mainAktual,
      probYa,
      probTidak,
      klasifikasi,
      prediksiSesuai,
      detailFaktor,
      rumusYa,
      rumusTidak
    };
  });

  return { probabilitasKelas, probabilitasAtribut, prediksi, atribut, countYa, countTidak, totalData };
};

const getPerhitunganPasien = async (req, res) => {
  try {
    const datasetDefisitRaw = await DatasetDefisit.findAll();
    const kriteriaDefisit = await KriteriaDefisit.findAll();
    const datasetSurplusRaw = await DatasetSurplus.findAll();
    const kriteriaSurplus = await KriteriaSurplus.findAll();

    const hasilDefisit = calculateNaiveBayes(datasetDefisitRaw, kriteriaDefisit, "Ya", "Tidak", "Main");
    const hasilSurplus = calculateNaiveBayes(datasetSurplusRaw, kriteriaSurplus, "Ya", "Tidak", "Main");

    const maxLen = Math.max(datasetDefisitRaw.length, datasetSurplusRaw.length);
    const hasilAkhir = Array.from({ length: maxLen }, (_, i) => {
      let kategori = "Kalori Normal";
      if (hasilDefisit.prediksi[i]?.klasifikasi === "Ya") kategori = "Defisit Kalori";
      else if (hasilSurplus.prediksi[i]?.klasifikasi === "Ya") kategori = "Surplus Kalori";
      return { pasien: `Pasien Nomor ${i + 1}`, kategori };
    });

    res.status(200).json({
      defisit: hasilDefisit,
      surplus: hasilSurplus,
      hasilAkhir
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getPerhitunganMakanan = async (req, res) => {
  try {
    const datasetMakananRaw = await DatasetMakanan.findAll();
    const kriteriaMakanan = await KriteriaMakanan.findAll();

    const hasilMakanan = calculateNaiveBayes(datasetMakananRaw, kriteriaMakanan, "Boleh", "Tidak Boleh", "Kategori");

    res.status(200).json(hasilMakanan);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  getPerhitunganPasien,
  getPerhitunganMakanan
};
