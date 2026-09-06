const express = require("express");
const {
  getHasilAkhirPasien,
  getHasilAkhirPasienById,
  createHasilAkhirPasien,
  addPasienBaru,
  deletePasienById,
  deleteAllHasilAkhirPasien
} = require("../controllers/HasilAkhirPasienController.js");
const { verifyUser } = require("../middleware/AuthUser.js");

const router = express.Router();

router.get('/hasil-akhir-pasien', verifyUser, getHasilAkhirPasien);
router.get('/hasil-akhir-pasien/:id', verifyUser, getHasilAkhirPasienById);
router.post('/hasil-akhir-pasien', verifyUser, createHasilAkhirPasien);
router.post('/pasien-baru', verifyUser, addPasienBaru);
router.delete('/pasien/:id', verifyUser, deletePasienById);
router.delete('/hasil-akhir-pasien', verifyUser, deleteAllHasilAkhirPasien);

module.exports = router;
