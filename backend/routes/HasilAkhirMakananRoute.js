const express = require("express");
const {
    getHasilAkhirMakanan,
    createHasilAkhirMakanan,
    deleteAllHasilAkhirMakanan
} = require("../controllers/HasilAkhirMakananController.js") 
const { verifyUser } = require("../middleware/AuthUser.js") 

const router = express.Router()

router.get('/hasil-akhir-makanan', verifyUser, getHasilAkhirMakanan)
router.post('/hasil-akhir-makanan', verifyUser, createHasilAkhirMakanan)
router.delete('/hasil-akhir-makanan', verifyUser, deleteAllHasilAkhirMakanan)

module.exports = router;