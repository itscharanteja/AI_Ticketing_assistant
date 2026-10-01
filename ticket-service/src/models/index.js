const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'ticketdb',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS !== undefined ? process.env.DB_PASS : 'password',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dialect: 'postgres',
  logging: false,
});

const db = {
  sequelize,
  Sequelize,
};

// Import models
db.Ticket = require('./ticket')(sequelize);

module.exports = db;
