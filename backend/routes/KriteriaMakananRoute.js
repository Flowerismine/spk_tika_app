const express = require("express");
const {
    getKriteriaMakanan,
    getKriteriaMakananById,
    createKriteriaMakanan,
    updateKriteriaMakanan,
    deleteKriteriaMakanan,
} = require("../controllers/KriteriaMakananController.js")
const { verifyUser } = require("../middleware/AuthUser.js")

const router = express.Router()

router.get('/kriteria-makanan', verifyUser, getKriteriaMakanan)
router.get('/kriteria-makanan/:id', verifyUser, getKriteriaMakananById)
router.post('/kriteria-makanan', verifyUser, createKriteriaMakanan)
router.patch('/kriteria-makanan/:id', verifyUser, updateKriteriaMakanan)
router.delete('/kriteria-makanan/:id', verifyUser, deleteKriteriaMakanan)

module.exports = router;