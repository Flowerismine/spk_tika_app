const express = require("express");
const {
    getDatasetDefisit,
    getDatasetDefisitById,
    createDatasetDefisit,
    updateDatasetDefisit,
    deleteDatasetDefisit,
    getDatasetFormat,
} = require("../controllers/DatasetDefisitController.js");

const { verifyUser } = require("../middleware/AuthUser.js");

const router = express.Router();

// Routes untuk Dataset Defisit
router.get('/dataset-defisit', verifyUser, getDatasetDefisit);
router.get('/dataset-defisit/format', verifyUser, getDatasetFormat);
router.get('/dataset-defisit/:id', verifyUser, getDatasetDefisitById);
router.post('/dataset-defisit', verifyUser, createDatasetDefisit);
router.patch('/dataset-defisit/:id', verifyUser, updateDatasetDefisit);
router.delete('/dataset-defisit/:id', verifyUser, deleteDatasetDefisit);

module.exports = router;