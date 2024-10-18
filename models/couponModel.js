const mongoose = require('mongoose')
const dayjs = require('dayjs')

const couponSchema = mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discountType: {
        type: String,
        enum: ['fixed', 'percent'],
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    usageLimit: {
        type:Number,
        required: true,
        default: null
    },
    startDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true,
        validate: {
            validator(value) {
                return value >= this.startDate
            }
        },
        default: function() {
            return dayjs(this.startDate).add(30, 'day').toDate()
        }
    },
    usageCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    user: [
        { type: mongoose.Schema.Types.ObjectId , ref: 'User'}
    ],
  courses: [{
    course: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'courses.courseType'
    },
    courseType: {
            type: String,
            enum: ['Course', 'LiveCourse']
        }}]
})

couponSchema.methods.isValid = function () {
    const now = new Date()
    const withinTimeRange = now >= this.startDate && now <= this.expiryDate
    const underUsageLimit = !this.usageLimit || this.usageCount < this.usageLimit
    return this.isActive && withinTimeRange && underUsageLimit
}


const Coupon = mongoose.model('Coupon', couponSchema)

module.exports = Coupon