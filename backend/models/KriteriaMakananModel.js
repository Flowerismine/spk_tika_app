const { Sequelize } = require("sequelize");
const db = require("../config/database.js");

const Users = require("./UserModel.js")

const { DataTypes } = Sequelize;

const KriteriaMakanan = db.define('kriteria_makanan', {
    namaKriteria: {
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

Users.hasMany(KriteriaMakanan);
KriteriaMakanan.belongsTo(Users, {foreignKey: 'userId'})

module.exports = KriteriaMakanan