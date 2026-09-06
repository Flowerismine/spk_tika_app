const express = require("express");
const {
    getUsers,
    getUsersById,
    createUsers,
    updateUsers,
    deleteUsers
} = require("../controllers/UserController.js");
const { verifyUser, adminOnly } = require("../middleware/AuthUser.js")

const router = express.Router();

router.get('/users', verifyUser, adminOnly, getUsers)
router.get('/users/:id', verifyUser, adminOnly, getUsersById)
router.post('/users', createUsers)
router.patch('/users/:id', verifyUser, adminOnly, updateUsers)
router.delete('/users/:id', verifyUser, adminOnly, deleteUsers)

module.exports = router;