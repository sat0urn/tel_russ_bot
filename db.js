const {Sequelize} = require('sequelize')

module.exports = new Sequelize(
    'tel_russ_bot',
    'postgres',
    'root',
    {
        host: '35.234.169.19',
        port: '5432',
        dialect: 'postgres'
    }
)