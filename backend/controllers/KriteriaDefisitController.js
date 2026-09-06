const KriteriaDefisit = require("../models/KriteriaDefisitModel.js");
const Users = require("../models/UserModel.js");

const { Op } = require("sequelize");

const getKriteriaDefisit = async (req, res) => {
    try {
        if (req.role === "admin") {
            const response = await KriteriaDefisit.findAll({
                include: [{
                    model: Users,
                    attributes: ['username', 'email', 'role']
                }],
            });
            res.status(200).json(response);
        } else {
            const response = await KriteriaDefisit.findAll({
                where: {
                    userId: req.userId,
                },
                include: [{
                    model: Users,
                    attributes: ['username', 'email', 'role']
                }],
            });
            res.status(200).json(response);
        }
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const getKriteriaDefisitById = async (req, res) => {
    try {
        const kriteria = await KriteriaDefisit.findOne({
            where: { id: req.params.id },
            include: [{
                model: Users,
                attributes: ['username', 'email', 'role']
            }]
        });

        if (!kriteria) return res.status(404).json({ msg: "Kriteria tidak ditemukan" });
        if (req.role !== "admin" && kriteria.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses terlarang" });
        }

        res.status(200).json(kriteria);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const createKriteriaDefisit = async (req, res) => {
    const namaKriteria = req.body.namaKriteria;

    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({ msg: "User ID not found in request" });
        }
        if (!namaKriteria) {
            return res.status(400).json({ msg: "Nama kriteria wajib diisi" });
        }

        const newKriteria = await KriteriaDefisit.create({
            namaKriteria: namaKriteria.trim(),
            userId: req.userId
        });

        res.status(201).json({ msg: "Kriteria Created", data: newKriteria });
    } catch (error) {
        res.status(500).json({ msg: "Failed to create Kriteria", error: error.message });
    }
};

const updateKriteriaDefisit = async (req, res) => {
    try {
        const kriteria = await KriteriaDefisit.findOne({ where: { id: req.params.id } });
        if (!kriteria) return res.status(404).json({ msg: "Kriteria tidak ditemukan" });

        if (req.role !== "admin" && kriteria.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses terlarang" });
        }

        await KriteriaDefisit.update(req.body, {
            where: { id: req.params.id }
        });
        res.status(200).json({ msg: "Kriteria Updated" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

const deleteKriteriaDefisit = async (req, res) => {
    try {
        const kriteria = await KriteriaDefisit.findOne({ where: { id: req.params.id } });
        if (!kriteria) return res.status(404).json({ msg: "Kriteria tidak ditemukan" });

        if (req.role !== "admin" && kriteria.userId !== req.userId) {
            return res.status(403).json({ msg: "Akses terlarang" });
        }

        await KriteriaDefisit.destroy({
            where: { id: req.params.id }
        });
        res.status(200).json({ msg: "Kriteria Deleted" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

module.exports = {
    getKriteriaDefisit,
    getKriteriaDefisitById,
    createKriteriaDefisit,
    updateKriteriaDefisit,
    deleteKriteriaDefisit
};