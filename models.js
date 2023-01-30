const sequelize = require('./db')
const {DataTypes} = require('sequelize')

module.exports = {
    UserModel: sequelize.define('user', {
        id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
        chat_id: {type: DataTypes.STRING, unique: true},
        bookmarks: {type: DataTypes.ARRAY(DataTypes.INTEGER)},
    }, {
        timestamps: false,
        createdAt: false,
        updatedAt: false,
    }),
    FilmModel: sequelize.define('film', {
        id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
        title: {type: DataTypes.STRING, unique: true, notNull: true},
        description: {type: DataTypes.TEXT('long'), notNull: true},
        author: {type: DataTypes.STRING, notNull: true},
        directors: {type: DataTypes.ARRAY(DataTypes.STRING), notNull: true},
        screenwriters: {type: DataTypes.ARRAY(DataTypes.STRING), notNull: true},
        genres: {type: DataTypes.ARRAY(DataTypes.STRING), notNull: true},
        year: {type: DataTypes.INTEGER, notNull: true},
        rating: {type: DataTypes.FLOAT, notNull: true},
    }, {
        timestamps: false,
        createdAt: false,
        updatedAt: false,
    }),
}