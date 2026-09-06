const DatasetMakanan = require("../models/DatasetMakananModel.js");
const KriteriaMakanan = require("../models/KriteriaMakananModel.js");
const User = require("../models/UserModel.js");
const { Op } = require("sequelize");
const db = require("../config/database.js");

const getDatasetMakanan = async (req, res) => {
  try {
    let response;
    if (req.role === "admin") {
      response = await DatasetMakanan.findAll({
        include: [
          {
            model: User,
            attributes: ["username", "email"],
          }
        ],
      });
    } else {
      response = await DatasetMakanan.findAll({
        where: {
          userId: req.userId,
        },
        include: [
          {
            model: User,
            attributes: ["username", "email"],
          }
        ],
      });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getDatasetMakananById = async (req, res) => {
  try {
    const response = await DatasetMakanan.findOne({
      where: {
        id: req.params.id,
      },
      include: [
        {
          model: User,
          attributes: ["username", "email"],
        }
      ],
    });

    if (!response) return res.status(404).json({ msg: "Data tidak ditemukan" });

    if (req.role !== "admin" && req.userId !== response.userId) {
      return res.status(403).json({ msg: "Akses terlarang" });
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createDatasetMakanan = async (req, res) => {
  const transaction = await db.transaction();
  
  try {
    const { nilai } = req.body;

    // Validasi input
    if (!nilai || typeof nilai !== 'object') {
      return res.status(400).json({ 
        msg: "Field 'nilai' harus berupa object yang berisi nilai untuk setiap kriteria" 
      });
    }

    // Ambil semua kriteria Makanan berdasarkan user
    let kriteria;
    if (req.role === "admin") {
      kriteria = await KriteriaMakanan.findAll({ where: { userId: req.userId } });
      if (kriteria.length === 0) {
        kriteria = await KriteriaMakanan.findAll();
      }
    } else {
      kriteria = await KriteriaMakanan.findAll({
        where: {
          userId: req.userId
        }
      });
    }

    // Validasi apakah semua kriteria memiliki nilai
    const kriteriaNames = [...new Set(kriteria.map(k => k.namaKriteria))];
    const inputKeys = Object.keys(nilai);
    
    // Cek apakah ada kriteria yang tidak memiliki nilai
    const missingKriteria = kriteriaNames.filter(name => !inputKeys.includes(name));
    if (missingKriteria.length > 0) {
      return res.status(400).json({ 
        msg: `Nilai untuk kriteria berikut harus diisi: ${missingKriteria.join(', ')}` 
      });
    }

    // Cek apakah ada input yang tidak sesuai dengan kriteria
    const extraKeys = inputKeys.filter(key => !kriteriaNames.includes(key));
    if (extraKeys.length > 0) {
      return res.status(400).json({ 
        msg: `Kriteria berikut tidak valid: ${extraKeys.join(', ')}` 
      });
    }

    // Buat dataset baru
    const dataset = await DatasetMakanan.create({
      nilai: nilai,
      userId: req.userId
    }, { transaction });

    await transaction.commit();

    // Ambil data yang baru dibuat dengan include
    const newDataset = await DatasetMakanan.findByPk(dataset.id, {
      include: [
        {
          model: User,
          attributes: ["username", "email"],
        }
      ]
    });

    res.status(201).json({
      msg: "Dataset Makanan berhasil ditambahkan",
      data: newDataset
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ msg: error.message });
  }
};

const updateDatasetMakanan = async (req, res) => {
  const transaction = await db.transaction();
  
  try {
    const { nilai } = req.body;
    const { id } = req.params;

    // Cari dataset yang akan diupdate
    const dataset = await DatasetMakanan.findOne({
      where: {
        id: id
      }
    });

    if (!dataset) {
      return res.status(404).json({ msg: "Dataset tidak ditemukan" });
    }

    // Cek authorization
    if (req.role !== "admin" && req.userId !== dataset.userId) {
      return res.status(403).json({ msg: "Akses terlarang" });
    }

    // Validasi input jika nilai baru diberikan
    if (nilai) {
      if (typeof nilai !== 'object') {
        return res.status(400).json({ 
          msg: "Field 'nilai' harus berupa object yang berisi nilai untuk setiap kriteria" 
        });
      }

      // Ambil semua kriteria Makanan berdasarkan user
      let kriteria;
      if (req.role === "admin") {
        kriteria = await KriteriaMakanan.findAll({ where: { userId: req.userId } });
        if (kriteria.length === 0) {
          kriteria = await KriteriaMakanan.findAll();
        }
      } else {
        kriteria = await KriteriaMakanan.findAll({
          where: {
            userId: req.userId
          }
        });
      }

      const kriteriaNames = [...new Set(kriteria.map(k => k.namaKriteria))];
      const inputKeys = Object.keys(nilai);
      
      // Validasi kriteria
      const missingKriteria = kriteriaNames.filter(name => !inputKeys.includes(name));
      if (missingKriteria.length > 0) {
        return res.status(400).json({ 
          msg: `Nilai untuk kriteria berikut harus diisi: ${missingKriteria.join(', ')}` 
        });
      }

      const extraKeys = inputKeys.filter(key => !kriteriaNames.includes(key));
      if (extraKeys.length > 0) {
        return res.status(400).json({ 
          msg: `Kriteria berikut tidak valid: ${extraKeys.join(', ')}` 
        });
      }
    }

    // Update dataset
    await DatasetMakanan.update({
      ...(nilai && { nilai: nilai })
    }, {
      where: { id: id },
      transaction
    });

    await transaction.commit();

    // Ambil data yang sudah diupdate
    const updatedDataset = await DatasetMakanan.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["username", "email"],
        }
      ]
    });

    res.status(200).json({
      msg: "Dataset Makanan berhasil diperbarui",
      data: updatedDataset
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ msg: error.message });
  }
};

const deleteDatasetMakanan = async (req, res) => {
  try {
    const { id } = req.params;

    // Cari dataset yang akan dihapus
    const dataset = await DatasetMakanan.findOne({
      where: {
        id: id
      }
    });

    if (!dataset) {
      return res.status(404).json({ msg: "Dataset tidak ditemukan" });
    }

    // Cek authorization
    if (req.role !== "admin" && req.userId !== dataset.userId) {
      return res.status(403).json({ msg: "Akses terlarang" });
    }

    // Hapus dataset
    await DatasetMakanan.destroy({
      where: {
        id: id
      }
    });

    res.status(200).json({ msg: "Dataset Makanan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Function untuk mendapatkan format dataset berdasarkan kriteria
const getDatasetFormat = async (req, res) => {
  try {
    let kriteria;
    if (req.role === "admin") {
      kriteria = await KriteriaMakanan.findAll({
        attributes: ['id', 'namaKriteria']
      });
    } else {
      kriteria = await KriteriaMakanan.findAll({
        where: {
          userId: req.userId
        },
        attributes: ['id', 'namaKriteria']
      });
    }

    // Buat template format
    const format = {};
    kriteria.forEach(k => {
      format[k.namaKriteria] = "";
    });

    res.status(200).json({
      msg: "Format dataset Makanan",
      format: format,
      kriteria: kriteria
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  getDatasetMakanan,
  getDatasetMakananById,
  createDatasetMakanan,
  updateDatasetMakanan,
  deleteDatasetMakanan,
  getDatasetFormat
};