const {Sequelize} = require('sequelize')
require('dotenv').config()

module.exports = new Sequelize(
    process.env.DATABASE_NAME,
    process.env.USERNAME_DB,
    process.env.PASSWORD_DB,
    {
        host: process.env.HOST_DB,
        port: process.env.PORT_DB,
        dialect: 'postgres'
    }
)