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
        enum: ["active", "inactive", "cancelled"],
        default: "active"
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'paid'
    },
    paymentMethod:{
        type: String,
        required: false
    },
    invoiceId: {
        type: String
    },
      discount: {
        type: Number,
        default: 0
      },
    autoRenew: { type: Boolean, default: true },
    trialPeriod: { type: Boolean, default: false },

}, { timestamps: true })

const Subscription = mongoose.model("Subscription", subscriptionSchema)

module.exports = {
    Subscription
}