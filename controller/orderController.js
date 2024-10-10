const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel');
const Course = require('../models/coursesModel');
const LiveCourse = require('../models/liveCourseModel');
const User = require('../models/userModel');
const Coupon = require('../models/couponModel');

const createCourseOrder = asyncHandler(async (req, res) => {
    const {
        orderCourses,
        paymentMethod,
        itemsPrice,
        totalPrice,
        invoiceId,
        userId,
        notes,
        discountedValue,
        coupon
      } = req.body;

      if (!orderCourses || orderCourses.length === 0) {
        return res.status(400).json({ message: "No order courses" });
      }
    
    //   let totalCoursePrice = orderCourses.reduce((total, item) => {
    //     return total  + item.price 
    //   }, 0)

     // totalCoursePrice = totalCoursePrice - (discountedValue || 0)
     const user = await User.findById(userId);
     if(!user) {
        return res.status(400).send({status: false, message: 'User not Found'})
     }
     for (const item of orderCourses) {
        const alreadyPurchased = user.purchasedCourses.some(purchasedCourse =>
          purchasedCourse.course && purchasedCourse.course.toString() === item.course ||
          purchasedCourse.livecourse && purchasedCourse.livecourse.toString() === item.livecourse
        );
    
        if (alreadyPurchased) {
          return res.status(400).json({status: false,  message: "You have already purchased this course." });
        }
      }
    

      const order = await Order.create({
        orderCourses,
        user: userId,
        paymentMethod,
        itemsPrice: itemsPrice,
        deliveryStatus: "Enrolled", 
        totalPrice: totalPrice,
        invoiceId,
        discountedValue,
        notes,
        coupon,
        isPaid: true,  
      });

  if(order) {
    for(let i = 0; i < orderCourses.length; i++) {
        const item = orderCourses[i];
        let course;
        const now = new Date();
        if (item.course) {
            course = await Course.findById(item.course);
            
          } else if (item.livecourse) {
            course = await LiveCourse.findById(item.livecourse);
          }
          if (course) {
            course.enrolledStudents.push(userId)
            course.enrolledStudentsCount = course.enrolledStudents.length
            await course.save();
        }
        let expiresAt;
        if(course?.durationType === "lifetime") {
            expiresAt = null
        } else {
            expiresAt = new Date()
            expiresAt.setMonth(now.getMonth() + course.duration)
        }
        
        
        user.purchasedCourses.push({
            course: item.course ? item.course : null,
            livecourse: item.livecourse ? item.livecourse : null,
            startedAt: now,
            expiresAt: expiresAt,
            status: "Enrolled",
          });

        await user.save()
    }
  if(coupon) {
    let couponToUpdate = await Coupon.findById(coupon.id)
    if(couponToUpdate.usageCount >= couponToUpdate.usageLimit) {
      couponToUpdate.isActive = false
    } else {
      couponToUpdate.usageCount = couponToUpdate.usageCount + 1
      couponToUpdate.user.push(userId)
    }

  await couponToUpdate.save()
  }
    res.status(201).json({
        message: "Course purchased successfully",
        course: order
    });
  }


})

module.exports = {
    createCourseOrder
}