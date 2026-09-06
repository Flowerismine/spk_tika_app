const express = require("express");
const {
    getDatasetMakanan,
    getDatasetMakananById,
    createDatasetMakanan,
    updateDatasetMakanan,
    deleteDatasetMakanan,
    getDatasetFormat,
} = require("../controllers/DatasetMakananController.js");

const { verifyUser } = require("../middleware/AuthUser.js");

const router = express.Router();

// Routes untuk Dataset Makanan
router.get('/dataset-makanan', verifyUser, getDatasetMakanan);
router.get('/dataset-makanan/format', verifyUser, getDatasetFormat);
router.get('/dataset-makanan/:id', verifyUser, getDatasetMakananById);
router.post('/dataset-makanan', verifyUser, createDatasetMakanan);
router.patch('/dataset-makanan/:id', verifyUser, updateDatasetMakanan);
router.delete('/dataset-makanan/:id', verifyUser, deleteDatasetMakanan);

module.exports = router;