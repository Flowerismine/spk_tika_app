const { Sequelize } = require("sequelize");
const db = require("../config/database.js");

const Users = require("./UserModel.js")

const { DataTypes } = Sequelize;

const HasilAkhirMakanan = db.define('hasil_akhir_makanan', {
    namaMakanan: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    kategori: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate:{
            notEmpty: true
        }
    }
}, {
    freezeTableName: true
});

Users.hasMany(HasilAkhirMakanan);
HasilAkhirMakanan.belongsTo(Users, {foreignKey: 'userId'})

module.exports = HasilAkhirMakanan