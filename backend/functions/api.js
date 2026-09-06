const serverless = require('serverless-http');
require('mysql2');
require('argon2');
const app = require('../index.js');

module.exports.handler = serverless(app);
