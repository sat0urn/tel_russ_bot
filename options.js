module.exports = {
    choiceOption: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Да', callback_data: 'yes'}, {text: 'Нет', callback_data: 'no'}],
            ]
        })
    },
    startOption: {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: 'Поиск', callback_data: 'search'}, {text: 'Закрыть', callback_data: 'close'}],
            ]
        })
    }
}