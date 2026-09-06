const { Sequelize } = require("sequelize");
const db = require("../config/database.js");

const Users = require("./UserModel.js")

const { DataTypes } = Sequelize;

const HasilAkhirPasien = db.define('hasil_akhir_pasien', {
    namaPasien: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    kategori: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    tipe: {
        type: DataTypes.STRING,
        defaultValue: 'pasien', // 'pasien' untuk data klinik nyata, 'training' untuk pembuktian model
        allowNull: false,
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
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

Users.hasMany(HasilAkhirPasien);
HasilAkhirPasien.belongsTo(Users, {foreignKey: 'userId'})

module.exports = HasilAkhirPasien