const DatasetSurplus = require("../models/DatasetSurplusModel.js");
const KriteriaSurplus = require("../models/KriteriaSurplusModel.js");
const User = require("../models/UserModel.js");
const { Op } = require("sequelize");
const db = require("../config/database.js");

const getDatasetSurplus = async (req, res) => {
  try {
    let response;
    if (req.role === "admin") {
      response = await DatasetSurplus.findAll({
        include: [
          {
            model: User,
            attributes: ["username", "email"],
          }
        ],
      });
    } else {
      response = await DatasetSurplus.findAll({
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

const getDatasetSurplusById = async (req, res) => {
  try {
    const response = await DatasetSurplus.findOne({
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

const createDatasetSurplus = async (req, res) => {
  const transaction = await db.transaction();
  
  try {
    const { nilai } = req.body;

    // Validasi input
    if (!nilai || typeof nilai !== 'object') {
      return res.status(400).json({ 
        msg: "Field 'nilai' harus berupa object yang berisi nilai untuk setiap kriteria" 
      });
    }

    // Ambil semua kriteria surplus berdasarkan user
    let kriteria;
    if (req.role === "admin") {
      kriteria = await KriteriaSurplus.findAll({ where: { userId: req.userId } });
      if (kriteria.length === 0) {
        kriteria = await KriteriaSurplus.findAll();
      }
    } else {
      kriteria = await KriteriaSurplus.findAll({
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
    const dataset = await DatasetSurplus.create({
      nilai: nilai,
      userId: req.userId
    }, { transaction });

    await transaction.commit();

    // Ambil data yang baru dibuat dengan include
    const newDataset = await DatasetSurplus.findByPk(dataset.id, {
      include: [
        {
          model: User,
          attributes: ["username", "email"],
        }
      ]
    });

    res.status(201).json({
      msg: "Dataset surplus berhasil ditambahkan",
      data: newDataset
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ msg: error.message });
  }
};

const updateDatasetSurplus = async (req, res) => {
  const transaction = await db.transaction();
  
  try {
    const { nilai } = req.body;
    const { id } = req.params;

    // Cari dataset yang akan diupdate
    const dataset = await DatasetSurplus.findOne({
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

      // Ambil semua kriteria surplus berdasarkan user
      let kriteria;
      if (req.role === "admin") {
        kriteria = await KriteriaSurplus.findAll({ where: { userId: req.userId } });
        if (kriteria.length === 0) {
          kriteria = await KriteriaSurplus.findAll();
        }
      } else {
        kriteria = await KriteriaSurplus.findAll({
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
    await DatasetSurplus.update({
      ...(nilai && { nilai: nilai })
    }, {
      where: { id: id },
      transaction
    });

    await transaction.commit();

    // Ambil data yang sudah diupdate
    const updatedDataset = await DatasetSurplus.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["username", "email"],
        }
      ]
    });

    res.status(200).json({
      msg: "Dataset surplus berhasil diperbarui",
      data: updatedDataset
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ msg: error.message });
  }
};

const deleteDatasetSurplus = async (req, res) => {
  try {
    const { id } = req.params;

    // Cari dataset yang akan dihapus
    const dataset = await DatasetSurplus.findOne({
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
    await DatasetSurplus.destroy({
      where: {
        id: id
      }
    });

    res.status(200).json({ msg: "Dataset surplus berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Function untuk mendapatkan format dataset berdasarkan kriteria
const getDatasetFormat = async (req, res) => {
  try {
    let kriteria;
    if (req.role === "admin") {
      kriteria = await KriteriaSurplus.findAll({
        attributes: ['id', 'namaKriteria']
      });
    } else {
      kriteria = await KriteriaSurplus.findAll({
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
      msg: "Format dataset surplus",
      format: format,
      kriteria: kriteria
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

module.exports = {
  getDatasetSurplus,
  getDatasetSurplusById,
  createDatasetSurplus,
  updateDatasetSurplus,
  deleteDatasetSurplus,
  getDatasetFormat
};