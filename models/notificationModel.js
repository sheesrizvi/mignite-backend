const mongoose = require("mongoose")

const notificationSchema = mongoose.Schema({
    users: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        isRead: { type: Boolean, default: false}
    }],
    message: {
        title: { type: String, required: true },
        body: { type: String, required: true },
        image: { type: String }
    }
}, { timestamps: true })

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification