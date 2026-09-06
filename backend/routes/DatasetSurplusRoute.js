const express = require("express");
const {
    getDatasetSurplus,
    getDatasetSurplusById,
    createDatasetSurplus,
    updateDatasetSurplus,
    deleteDatasetSurplus,
    getDatasetFormat
} = require("../controllers/DatasetSurplusController.js");

const { verifyUser } = require("../middleware/AuthUser.js");

const router = express.Router();

router.get('/dataset-surplus', verifyUser, getDatasetSurplus);
router.get('/dataset-surplus/format', verifyUser, getDatasetFormat);
router.get('/dataset-surplus/:id', verifyUser, getDatasetSurplusById);
router.post('/dataset-surplus', verifyUser, createDatasetSurplus);
router.patch('/dataset-surplus/:id', verifyUser, updateDatasetSurplus);
router.delete('/dataset-surplus/:id', verifyUser, deleteDatasetSurplus);

module.exports = router;