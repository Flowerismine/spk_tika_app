const express = require('express');
const {
  getPerhitunganPasien,
  getPerhitunganMakanan
} = require('../controllers/PerhitunganController.js');

const router = express.Router();

router.get('/hitung-pasien', getPerhitunganPasien);
router.get('/hitung-makanan', getPerhitunganMakanan);

module.exports = router;
