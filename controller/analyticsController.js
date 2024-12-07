const asyncHandler = require('express-async-handler')
const Instructor = require('../models/instructorModel')
const Course = require('../models/coursesModel')
const LiveCourse = require('../models/liveCourseModel')
const Order = require('../models/orderModel')

const shareDashboardData = asyncHandler(async (req, res) => {
    const instructorCount = await Instructor.countDocuments({})
    const coursesCount = await Course.countDocuments({})
    const livecoursesCount = await LiveCourse.countDocuments({})
    const ordersCount = await Order.countDocuments({})
    const currentYear = new Date().getFullYear()

    const monthlySales = await Order.aggregate([
        { $match: { isPaid: true } },
        {
            $project: {
                month: { $month: "$createdAt" },
                year: { $year: "$createdAt" },
                finalPrice: "$totalPrice"
            }
        },
        {
            $match: { year: currentYear }
        },
        {
            $group: {
                _id: "$month",
                sales: { $sum: "$finalPrice" }
            }
        },
        {
            $addFields: {
                sales: { $round: ["$sales", 2] } 
            }
        },
        {
            $sort: { _id: 1 }
        }
    ])

    res.status(200).send({ instructorCount, coursesCount, livecoursesCount, ordersCount, monthlySales  })
    
})

module.exports = {
    shareDashboardData
}