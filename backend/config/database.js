const { Sequelize } = require("sequelize");
require("dotenv").config();

const poolConfig = {
  max: 3,
  min: 0,
  acquire: 30000,
  idle: 10000,
};

const createConnection = () => {
  const dbUrl = process.env.DB_URL || process.env.MYSQL_ADDON_URI || "mysql://ur3srnxqh9h3ucnr:MRLprby5vYVXNIaRUza5@bzlztvgqb5ictbp8cqf1-mysql.services.clever-cloud.com:3306/bzlztvgqb5ictbp8cqf1";

  return new Sequelize(dbUrl, {
    dialect: "mysql",
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    },
    logging: false,
    pool: poolConfig,
  });
};

if (!global.__sequelizeInstance) {
  global.__sequelizeInstance = createConnection();
}

module.exports = global.__sequelizeInstance;
