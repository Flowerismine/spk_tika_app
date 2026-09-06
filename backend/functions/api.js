const serverless = require('serverless-http');
require('mysql2');
require('bcryptjs');
const app = require('../index.js');

module.exports.handler = serverless(app);
