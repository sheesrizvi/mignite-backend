const mongoose = require('mongoose')

const BannerSecondSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    images: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'Banner'
    }
})

const BannerSecond = mongoose.model('BannerSecond', BannerSecondSchema)

module.exports = BannerSecond
