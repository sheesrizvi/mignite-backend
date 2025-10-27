const mongoose = require('mongoose')

const BannerSchema = new mongoose.Schema({
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
    },
    bannerType: {
        type: String,
        enum: ["academic", "professional", "language", "home"]
    }
})

const Banner = mongoose.model('Banner', BannerSchema)

module.exports = Banner
