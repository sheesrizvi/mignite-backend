const mongoose = require('mongoose')

const userProgressSchema = mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    viewedSections: [
        {
            section: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Section'
            },
            viewedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    courseCompletePercentage: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

const UserProgress = mongoose.model('UserProgress', userProgressSchema)

module.exports = UserProgress