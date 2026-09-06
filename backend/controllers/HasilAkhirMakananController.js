const HasilAkhirMakanan = require("../models/HasilAkhirMakananModel.js");
const Users = require("../models/UserModel.js");

const { Op } = require("sequelize");

const getHasilAkhirMakanan = async (req, res) => {
  try {
    if (req.role === "admin") {
      const response = await HasilAkhirMakanan.findAll({
        include: [
          {
            model: Users,
            attributes: ["username", "email", "role"],
          },
        ],
      });
      res.status(200).json(response);
    } else {
      const response = await HasilAkhirMakanan.findAll({
        where: {
          userId: req.userId,
        },
        include: [
          {
            model: Users,
            attributes: ["username", "email", "role"],
          },
        ],
      });
      res.status(200).json(response);
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const createHasilAkhirMakanan = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "User ID not found in the request" });
    }

    // Check if hasilAkhirMakanan data array exists
    if (!req.body.hasilAkhirMakanan || !Array.isArray(req.body.hasilAkhirMakanan)) {
      return res
        .status(400)
        .json({ error: "Invalid hasil akhir Makanan data. Expected an array." });
    }

    // Add userId to each Hasil Akhir Makanan object
    const hasilAkhirMakanansWithUserId = req.body.hasilAkhirMakanan.map((hasilAkhirMakanan) => ({
      ...hasilAkhirMakanan,
      userId: userId,
    }));

    // Delete any existing Hasil Akhir Makanans for this user to avoid duplicates
    await HasilAkhirMakanan.destroy({ where: { userId: userId } });

    // Create all new Hasil Akhir Makanans in a single transaction
    await HasilAkhirMakanan.bulkCreate(hasilAkhirMakanansWithUserId);

    res.json({ msg: "Hasi Akhir Makanan Created Successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "Failed to create Hasil Akhir Makanan", details: error.message });
  }
};

const deleteAllHasilAkhirMakanan = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "User ID not found in the request" });
    }

    const confirm = req.query.confirm === "true";

    if (!confirm) {
      return res.status(400).json({
        error:
          "This action will delete ALL your Data. Add ?confirm=true to confirm.",
      });
    }

    const deleted = await HasilAkhirMakanan.destroy({
      where: {
        userId: userId,
      },
    });

    return res.json({
      message: `Successfully deleted all your data hasil akhir (${deleted} records)`,
      deletedCount: deleted,
    });
  } catch (error) {
    console.error("Error deleting all data hasil akhir:", error);
    return res.status(500).json({
      error: "Failed to delete all data hasil akhir",
      details: error.message,
    });
  }
};

module.exports = {
  getHasilAkhirMakanan,
  createHasilAkhirMakanan,
  deleteAllHasilAkhirMakanan,
};
