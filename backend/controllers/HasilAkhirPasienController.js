const HasilAkhirPasien = require("../models/HasilAkhirPasienModel.js");
const Users = require("../models/UserModel.js");

const getHasilAkhirPasien = async (req, res) => {
  try {
    const { tipe } = req.query; // 'pasien' atau 'training'
    const whereClause = {};

    if (req.role !== "admin") {
      whereClause.userId = req.userId;
    }

    if (tipe) {
      whereClause.tipe = tipe;
    }

    const response = await HasilAkhirPasien.findAll({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: [{ model: Users, attributes: ["username", "email", "role"] }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const getHasilAkhirPasienById = async (req, res) => {
  try {
    const response = await HasilAkhirPasien.findOne({
      where: { id: req.params.id },
      include: [{ model: Users, attributes: ["username", "email"] }]
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

// Bulk create — untuk hasil pembuktian Naive Bayes (training data)
const createHasilAkhirPasien = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).json({ error: "User ID not found in the request" });
    if (!req.body.hasilAkhirPasien || !Array.isArray(req.body.hasilAkhirPasien)) {
      return res.status(400).json({ error: "Invalid hasil akhir pasien data. Expected an array." });
    }
    const data = req.body.hasilAkhirPasien.map(h => ({
      ...h,
      tipe: 'training',
      userId
    }));
    
    // Hanya hapus data pembuktian training lama, BUKAN data pasien klinik!
    await HasilAkhirPasien.destroy({ where: { userId, tipe: 'training' } });
    await HasilAkhirPasien.bulkCreate(data);
    res.json({ msg: "Hasil Akhir Pasien Created Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create", details: error.message });
  }
};

// Single create — untuk klasifikasi pasien baru (real patient)
const addPasienBaru = async (req, res) => {
  try {
    const userId = req.userId;
    const { namaPasien, kategori, metadata } = req.body;
    if (!namaPasien || !kategori) {
      return res.status(400).json({ msg: "namaPasien dan kategori wajib diisi" });
    }
    const result = await HasilAkhirPasien.create({
      namaPasien,
      kategori,
      tipe: 'pasien',
      metadata: metadata || null,
      userId
    });
    res.status(201).json({ msg: "Pasien berhasil disimpan", data: result });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// Delete single record
const deletePasienById = async (req, res) => {
  try {
    const result = await HasilAkhirPasien.findOne({ where: { id: req.params.id } });
    if (!result) return res.status(404).json({ msg: "Data tidak ditemukan" });
    if (req.role !== "admin" && req.userId !== result.userId) {
      return res.status(403).json({ msg: "Akses terlarang" });
    }
    await result.destroy();
    res.status(200).json({ msg: "Pasien berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const deleteAllHasilAkhirPasien = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).json({ error: "User ID not found" });
    const confirm = req.query.confirm === "true";
    if (!confirm) return res.status(400).json({ error: "Add ?confirm=true to confirm." });
    
    // Default hanya hapus tipe training jika tidak dispesifikasikan
    const tipeToDelete = req.query.tipe || 'training';
    const deleted = await HasilAkhirPasien.destroy({
      where: { userId, tipe: tipeToDelete }
    });
    return res.json({ message: `Deleted ${deleted} records`, deletedCount: deleted });
  } catch (error) {
    return res.status(500).json({ error: "Failed", details: error.message });
  }
};

module.exports = {
  getHasilAkhirPasien,
  getHasilAkhirPasienById,
  createHasilAkhirPasien,
  addPasienBaru,
  deletePasienById,
  deleteAllHasilAkhirPasien,
};

