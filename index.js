const TelegramApi = require('node-telegram-bot-api')
const sequelize = require('./db')
const {choiceOption, startOption} = require('./options')
const {UserModel, FilmModel} = require('./models')
const {Sequelize} = require("sequelize");

const token = '6085121684:AAGxx3urYuZf70S5NSqpSYSJmhIGRkTNmKo'
const logoUrl = 'https://raw.githubusercontent.com/sat0urn/tel_russ_bot/master/images/logo.webp'

const bot = new TelegramApi(token, {polling: true})

const films = {}
let filmsIds = []
let gate = false;

const filmChoiceOptions = {reply_markup: JSON.stringify({inline_keyboard: []})}

// ФУНКЦИЯ ДЛЯ ПОИСК ФИЛЬМОВ ПО НАЗВАНИЮ
const filmsSearch = async (chatId, text) => {
    const [results, metadata] = await sequelize.query(
        'SELECT * FROM films WHERE STRPOS(LOWER(title), LOWER(?)) > 0',
        {
            replacements: [text]
        });

    films[chatId] = results;
}

// ФУНКЦИЯ ВЫВОДА ФИЛЬМОВ И ДАЛЬНЕЙШАЯ ОПЕРАЦИЯ С НИМИ
const filmsOutput = async (chatId, text) => {
    try {
        await filmsSearch(chatId, text)

        const data = films[chatId];
        const inlineMarkupObjects = [[]]
        let counter = 0;
        let check = false;

        data.map(d => filmsIds.push(d.id))

        if (data.length !== 0) {
            await bot.sendMessage(chatId, 'Список фильмов по названию: ')

            for (let i = 0; i < data.length; i++) {
                await bot.sendMessage(chatId,
                    `${data[i].id}. ${data[i].title}\n\n` +
                    `Описание: ${data[i].description}\n\n` +
                    `Автор книги: ${data[i].author}\n\n` +
                    `Режиссёр: ${data[i].directors}\n\n` +
                    `Сценаристы: ${data[i].screenwriters}\n\n` +
                    `Жанры: ${data[i].genres}\n\n` +
                    `Год: ${data[i].year}\n\n` +
                    `Рейтинг: ${data[i].rating}`)
            }

            if (data.length === 1) {

                return bot.sendMessage(chatId, 'Сохранить в закладках?', choiceOption)

            } else if (data.length > 1) {
                for (let i = 0; i < data.length; i++) {
                    for (let j = 0; j < 4; j++) {
                        let inMarkObject = {
                            text: "" + filmsIds[counter],
                            callback_data: "" + filmsIds[counter]
                        }

                        if (filmsIds[counter] !== undefined) inlineMarkupObjects[i].push(inMarkObject);

                        counter++;

                        if (filmsIds.length < counter) { check = true; break; }
                    }

                    if (check) break;
                }

                filmChoiceOptions.reply_markup = JSON.stringify({inline_keyboard: inlineMarkupObjects})

                return bot.sendMessage(chatId, 'Какое кино вы хотите сохранить в закладках?', filmChoiceOptions)

            }
        } else {

            return bot.sendMessage(chatId, 'Извините, но экранизация данной книги у нас отсутствуют')

        }
    } catch (e) {

        return bot.sendMessage(chatId, 'Произошла ошибка в функции \'again\'! Приношу извинения...')

    }
}

// ФУНКЦИЯ ДОБАВЛЕНИЯ ИДЕНТИФИКАТОРА КИНО В МАССИВ ЗАКЛАДОК
const filmsArrayAppend = async (chatId, id) => {
    try {
        const user = await UserModel.findOne({chat_id: chatId});
        const singleFilm = await FilmModel.findOne({where: {id: id}})
        const bookmarks = user.bookmarks;

        if (bookmarks !== null) {
            bookmarks.sort()
            filmsIds.sort()

            filmsIds.map(r => {
                bookmarks.map(b => {
                    if (b === r) {
                        const index = filmsIds.indexOf(b);
                        filmsIds.splice(index, 1)
                    }
                })
            })
        }

        if (filmsIds.includes(id)) {
            await UserModel.update({
                bookmarks: Sequelize.fn('array_append', Sequelize.col('bookmarks'), id)
            }, {
                where: {chat_id: chatId}
            })

            await bot.sendMessage(chatId, `'${singleFilm.title}' добавлен в ваши закладки!`)
        } else {
            await bot.sendMessage(chatId, `'${singleFilm.title}' уже у вас в закладках, проверьте здесь /bookmark!`)
        }
    } catch (e) {
        console.log(e)
        return bot.sendMessage(chatId, 'Произошла ошибка в функции добавление идентификатора в базу! Приношу извинения...')
    }
}

// ГЛАВНАЯ ФУНКЦИЯ ВЫПОЛНЕНИЯ ВСЕХ ОПЕРАЦИИ
const start = async () => {

    // Подключение к БАЗЕ ДАННЫХ
    try {
        await sequelize.authenticate()
        await sequelize.sync()
    } catch (e) {
        console.log('Подключение к бд сломалось: ', e)
    }

    // Команды-помощники телеграм
    await bot.setMyCommands([
        {command: '/start', description: 'Начальное приветствие'},
        {command: '/search', description: 'Начать поиск экранизированных книг'},
        {command: '/bookmark', description: 'Получить список выбранных книг'}
    ])

    // Слушатель событии сообщении
    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;

        try {
            const user = await UserModel.findOne({chat_id: chatId})

            if (user != null) {
                // НАЧАТЬ
                if (text === '/start') {
                    if (msg.from.last_name === undefined) {
                        await bot.sendSticker(chatId, logoUrl)
                        return bot.sendMessage(chatId, `Добро пожаловать снова сюда, ${msg.from.first_name}!)`);
                    } else {
                        await bot.sendSticker(chatId, logoUrl)
                        return bot.sendMessage(chatId, `Добро пожаловать снова сюда, ${msg.from.first_name} ${msg.from.last_name}!)`);
                    }
                }

                // ПОИСК
                if (text === '/search') {
                    gate = true;
                    return bot.sendMessage(chatId, 'Напишите название книги: ');
                }

                // BOOKMARKS
                if (text === '/bookmark') {
                    const user = await UserModel.findOne({chat_id: chatId});
                    const results = user.bookmarks;

                    await bot.sendMessage(chatId, 'Ваши сохраенные фильмы:');

                    let singleFilm = {}

                    for (let i = 0; i < results.length; i++) {
                        singleFilm = await FilmModel.findOne({where: {id: results[i]}});
                        await bot.sendMessage(chatId,
                            `${singleFilm.id}. ${singleFilm.title}\n\n` +
                            `Описание: ${singleFilm.description}\n\n` +
                            `Автор книги: ${singleFilm.author}\n\n` +
                            `Режиссёр: ${singleFilm.directors}\n\n` +
                            `Сценаристы: ${singleFilm.screenwriters}\n\n` +
                            `Жанры: ${singleFilm.genres}\n\n` +
                            `Год: ${singleFilm.year}\n\n` +
                            `Рейтинг: ${singleFilm.rating}`)
                    }

                    return bot.sendMessage(chatId, 'Хотите продолжить поиск?', startOption)
                }
            } else {
                await UserModel.create({chat_id: chatId})
                await bot.sendSticker(chatId, logoUrl)
                return bot.sendMessage(chatId,
                    'Добро пожаловать в телеграм бот FilmAdaptBot!\n' +
                    'Мы предоставляем экранизацию произведении(книг),\n' +
                    'которые вы напишите!')
            }

            // Доступ к ПОИСКу
            if (gate) return filmsOutput(chatId, text)

            return bot.sendMessage(chatId, 'Я вас не понимаю извините...' )
        } catch (e) {
            console.log(e)
            return bot.sendMessage(chatId, 'Произошла ошибка в функции \'start\'! Приношу извинения...')

        }
    })

    // Слушатель событии кнопок
    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;

        try {
            // Добавление из выбора множеств экземпляров (больше 1-го)
            if (filmsIds != null && filmsIds.includes(parseInt(data))) {
                await filmsArrayAppend(chatId, parseInt(data))

                films[chatId] = {}
                filmsIds = []

                return bot.sendMessage(chatId, 'Хотите продолжить поиск?', startOption)
            }

            // Добавление одиночного экземпляра
            if (data === 'yes') {
                await filmsArrayAppend(chatId, films[chatId][0].id)

                films[chatId] = {}
                filmsIds = []

                return bot.sendMessage(chatId, 'Хотите продолжить поиск?', startOption)
            }

            // Не добавлять фильм в ЗАКЛАДКИ
            if (data === 'no') {
                await bot.sendMessage(chatId, `'${films[chatId][0].title}' НЕ добавлен, можете продолжить поиск`, startOption)

                films[chatId] = {}
                filmsIds = []

                return;
            }

            // ЗАКЛАДКИ -> Поиск
            if (data === 'search') {
                films[chatId] = {}
                filmsIds = []

                gate = true;
                return bot.sendMessage(chatId, 'Напишите название книги: ')
            }

            // ЗАКЛАДКИ -> Отмена
            if (data === 'close') {
                films[chatId] = {}
                filmsIds = []

                gate = false;
                return bot.sendMessage(chatId, 'Спасибо что были здесь!')
            }

            // Доступ к продолжению ПОИСКа
            if (gate) return filmsOutput(chatId, data)

        } catch (e) {

            return bot.sendMessage(chatId, 'Произошла ошибка в слушателе событии кнопок! Приношу извинения...')

        }
    })
}

// НАЧАТЬ
start()