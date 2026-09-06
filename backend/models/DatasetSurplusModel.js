const { Sequelize } = require("sequelize");
const db = require("../config/database.js");

const Users = require("./UserModel.js")

const { DataTypes } = Sequelize;

const DatasetSurplus = db.define('dataset_surplus', {
    nilai: {
        type: DataTypes.JSON, // Menyimpan data sebagai JSON object
        allowNull: false,
        get() {
            const rawValue = this.getDataValue('nilai');
            // Jika nilai adalah string, parse menjadi object
            if (typeof rawValue === 'string') {
                try {
                    return JSON.parse(rawValue);
                } catch (error) {
                    console.error('Error parsing JSON nilai:', error);
                    return {};
                }
            }
            return rawValue || {};
        },
        set(value) {
            // Pastikan value disimpan sebagai object
            this.setDataValue('nilai', value);
        }
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

Users.hasMany(DatasetSurplus);
DatasetSurplus.belongsTo(Users, {foreignKey: 'userId'})

module.exports = DatasetSurplus