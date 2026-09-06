const { Sequelize } = require("sequelize");
const db = require("../config/database.js");

const Users = require("./UserModel.js")

const { DataTypes } = Sequelize;

const KriteriaSurplus = db.define('kriteria_surplus', {
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

Users.hasMany(KriteriaSurplus);
KriteriaSurplus.belongsTo(Users, {foreignKey: 'userId'})

module.exports = KriteriaSurplus