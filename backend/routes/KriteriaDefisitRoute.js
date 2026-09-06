const express = require("express");
const {
    getKriteriaDefisit,
    getKriteriaDefisitById,
    createKriteriaDefisit,
    updateKriteriaDefisit,
    deleteKriteriaDefisit,
} = require("../controllers/KriteriaDefisitController.js") 
const { verifyUser } = require("../middleware/AuthUser.js") 

const router = express.Router()

router.get('/kriteria-defisit', verifyUser, getKriteriaDefisit)
router.get('/kriteria-defisit/:id', verifyUser, getKriteriaDefisitById)
router.post('/kriteria-defisit', verifyUser, createKriteriaDefisit)
router.patch('/kriteria-defisit/:id', verifyUser, updateKriteriaDefisit)
router.delete('/kriteria-defisit/:id', verifyUser, deleteKriteriaDefisit)

module.exports = router;