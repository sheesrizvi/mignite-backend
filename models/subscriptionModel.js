const mongoose = require("mongoose")


const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan'
    },
    duration: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["active", "inactive" , "cancelled", "expired"],
        default: "active"
    },
    autoRenew: { type: Boolean, default: true },
    trialPeriod: { type: Boolean, default: false },

})

const Subscription = mongoose.model("Subscription", subscriptionSchema)

module.exports = {
    Subscription
}