const mongoose = require("mongoose")


const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true
    },
    durationInMonths: {
        type: Number,
        required: true,
        default: 1
    },
    discount: {
        type: Number
    },
    level: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
    courses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    ],
    liveCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LiveCourse'
        }
    ],
    features: {
        type: [String]
    }
})

const Plan = mongoose.model("Plan", planSchema)

module.exports = {
    Plan
}