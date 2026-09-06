const Users = require("../models/UserModel.js");
const argon = require("argon2");
const jwt = require('jsonwebtoken');

const getUsers = async(req, res) => {
    try {
        const response = await Users.findAll({
            attributes: ['uuid', 'username', 'email', 'role']
        })
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json({msg: error.message})
    }
}

const getUsersById = async(req, res) => {
    try {
        const response = await Users.findOne({
            attributes: ['uuid', 'username', 'email', 'role'],
            where: {
                uuid: req.params.id
            }
        })
        res.status(200).json(response)
    } catch (error) {
        res.status(500).json({msg: error.message})
    }
}

const createUsers = async(req, res) => {
    const {username, email, password, confPassword, role} = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({msg: "Semua field wajib diisi"});
    }
    if (password !== confPassword) {
        return res.status(400).json({msg: "Password dan confirm password tidak cocok"});
    }
    
    // Cegah privilege escalation: Hanya admin terotentikasi yang bisa membuat role admin
    const assignedRole = (req.role === "admin" && role) ? role : "user";
    
    try {
        const hashPassword = await argon.hash(password);
        await Users.create({
            username: username,
            email: email,
            password: hashPassword,
            role: assignedRole
        });
        res.status(201).json({msg: "Register berhasil!"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}

const updateUsers = async(req, res) =>{
    const user = await Users.findOne({
        where: {
            uuid: req.params.id
        }
    });
    if(!user) return res.status(404).json({msg: "User tidak ditemukan"});
    const {username, email, password, confPassword, role} = req.body;
    let hashPassword;
    if(password === "" || password === null){
        hashPassword = user.password
    }else{
        hashPassword = await argon.hash(password);
    }
    if(password !== confPassword) return res.status(400).json({msg: "Password dan Confirm Password tidak cocok"});
    try {
        await Users.update({
            username: username,
            email: email,
            password: hashPassword,
            role: role
        },{
            where:{
                id: user.id
            }
        });
        res.status(200).json({msg: "User Updated"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}

const deleteUsers = async(req, res) => {
    const user = await Users.findOne({
        where: {
            uuid: req.params.id
        }
    })
    if (!user) return res.status(404).json({msg: "User tidak ditemukan"})
    try {
        await Users.destroy({
            where:{
                id: user.id
            }
        })
        res.status(200).json({msg: "User Deleted"})
    } catch (error) {
        res.status(400).json({msg: error.message})
    }
}

module.exports = {
    getUsers,
    getUsersById,
    createUsers,
    updateUsers,
    deleteUsers
};