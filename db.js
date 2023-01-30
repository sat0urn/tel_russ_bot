const {Sequelize} = require('sequelize')
require('dotenv').config()

module.exports = new Sequelize(
    process.env.LOCAL_DATABASE_NAME,
    process.env.LOCAL_USERNAME_DB,
    process.env.LOCAL_PASSWORD_DB,
    {
        host: process.env.LOCAL_HOST_DB,
        port: process.env.LOCAL_PORT_DB,
        dialect: 'postgres'
    }
)