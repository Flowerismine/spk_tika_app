const DatasetDefisit = require("../models/DatasetDefisitModel.js");
const KriteriaDefisit = require("../models/KriteriaDefisitModel.js");
const User = require("../models/UserModel.js");
const { Op } = require("sequelize");
const db = require("../config/database.js");

const getDatasetDefisit = async (req, res) => {
  try {
    let response;
    if (req.role === "admin") {
      response = await DatasetDefisit.findAll({
        include: [
          {
            model: User,
            attributes: ["username", "email"],
          }
        ],
      });
    } else {
      response = await DatasetDefisit.findAll({
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

const getDatasetDefisitById = async (req, res) => {
  try {
    const response = await DatasetDefisit.findOne({
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

const createDatasetDefisit = async (req, res) => {
  const transaction = await db.transaction();
  
  try {
    const { nilai } = req.body;

    // Validasi input
    if (!nilai || typeof nilai !== 'object') {
      return res.status(400).json({ 
        msg: "Field 'nilai' harus berupa object yang berisi nilai untuk setiap kriteria" 
      });
    }

    // Ambil kriteria defisit (prioritas milik user saat ini)
    let kriteria;
    if (req.role === "admin") {
      kriteria = await KriteriaDefisit.findAll({ where: { userId: req.userId } });
      if (kriteria.length === 0) {
        kriteria = await KriteriaDefisit.findAll();
      }
    } else {
      kriteria = await KriteriaDefisit.findAll({
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
    const dataset = await DatasetDefisit.create({
      nilai: nilai,
      userId: req.userId
    }, { transaction });

    await transaction.commit();

    // Ambil data yang baru dibuat dengan include
    const newDataset = await DatasetDefisit.findByPk(dataset.id, {
      include: [
        {
          model: User,
          attributes: ["username", "email"],
        }
      ]
    });

    res.status(201).json({
      msg: "Dataset defisit berhasil ditambahkan",
      data: newDataset
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ msg: error.message });
  }
};

const updateDatasetDefisit = async (req, res) => {
  const transaction = await db.transaction();
  
  try {
    const { nilai } = req.body;
    const { id } = req.params;

    // Cari dataset yang akan diupdate
    const dataset = await DatasetDefisit.findOne({
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

      // Ambil semua kriteria defisit berdasarkan user
      let kriteria;
      if (req.role === "admin") {
        kriteria = await KriteriaDefisit.findAll({ where: { userId: req.userId } });
        if (kriteria.length === 0) {
          kriteria = await KriteriaDefisit.findAll();
        }
      } else {
        kriteria = await KriteriaDefisit.findAll({
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
    await DatasetDefisit.update({
      ...(nilai && { nilai: nilai })
    }, {
      where: { id: id },
      transaction
    });

    await transaction.commit();

    // Ambil data yang sudah diupdate
    const updatedDataset = await DatasetDefisit.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["username", "email"],
        }
      ]
    });

    res.status(200).json({
      msg: "Dataset defisit berhasil diperbarui",
      data: updatedDataset
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ msg: error.message });
  }
};

const deleteDatasetDefisit = async (req, res) => {
  try {
    const { id } = req.params;

    // Cari dataset yang akan dihapus
    const dataset = await DatasetDefisit.findOne({
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
    await DatasetDefisit.destroy({
      where: {
        id: id
      }
    });

    res.status(200).json({ msg: "Dataset defisit berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Function untuk mendapatkan format dataset berdasarkan kriteria
const getDatasetFormat = async (req, res) => {
  try {
    let kriteria;
    if (req.role === "admin") {
      kriteria = await KriteriaDefisit.findAll({
        attributes: ['id', 'namaKriteria']
      });
    } else {
      kriteria = await KriteriaDefisit.findAll({
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
      msg: "Format dataset defisit",
      format: format,
      kriteria: kriteria
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  getDatasetDefisit,
  getDatasetDefisitById,
  createDatasetDefisit,
  updateDatasetDefisit,
  deleteDatasetDefisit,
  getDatasetFormat
};