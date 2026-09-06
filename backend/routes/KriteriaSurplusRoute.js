const express = require("express");
const {
    getKriteriaSurplus,
    getKriteriaSurplusById,
    createKriteriaSurplus,
    updateKriteriaSurplus,
    deleteKriteriaSurplus,
} = require("../controllers/KriteriaSurplusController.js") 
const { verifyUser } = require("../middleware/AuthUser.js") 

const router = express.Router()

router.get('/kriteria-surplus', verifyUser, getKriteriaSurplus)
router.get('/kriteria-surplus/:id', verifyUser, getKriteriaSurplusById)
router.post('/kriteria-surplus', verifyUser, createKriteriaSurplus)
router.patch('/kriteria-surplus/:id', verifyUser, updateKriteriaSurplus)
router.delete('/kriteria-surplus/:id', verifyUser, deleteKriteriaSurplus)

module.exports = router;