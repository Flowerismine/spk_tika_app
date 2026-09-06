const { Sequelize } = require("sequelize");
const db = require("../config/database.js");

const Users = require("./UserModel.js")

const { DataTypes } = Sequelize;

const KriteriaDefisit = db.define('kriteria_defisit', {
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

Users.hasMany(KriteriaDefisit);
KriteriaDefisit.belongsTo(Users, {foreignKey: 'userId'})

module.exports = KriteriaDefisit