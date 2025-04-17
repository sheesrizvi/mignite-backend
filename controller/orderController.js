const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel');
const Course = require('../models/coursesModel');
const LiveCourse = require('../models/liveCourseModel');
const User = require('../models/userModel');
const Coupon = require('../models/couponModel');
const { options, search } = require('../routes/adminRoutes');
const UserProgress = require('../models/userProgressModel');

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
        // if(course?.durationType === "lifetime") {
        //     expiresAt = null
        // } else {
        //     expiresAt = new Date()
        //     expiresAt.setMonth(now.getMonth() + course.duration)
        // }
        
        if(item.course) {
          expiresAt = null
        } else if (item.livecourse) {
          expiresAt = item.livecourse.endDate || null
        }
        
        user.purchasedCourses.push({
            course: item.course ? item.course : null,
            livecourse: item.livecourse ? item.livecourse : null,
            startedAt: now,
            expiresAt: expiresAt,
            status: "Enrolled",
          });

        await user.save()

        if(item.course) {
         await UserProgress.create({
            user: userId,
            course: item.course
          })
        
        }

    }
  if(coupon) {
    let couponToUpdate = await Coupon.findById(coupon.id)
    if(couponToUpdate.usageCount > couponToUpdate.usageLimit) {
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

const getAllOrders = asyncHandler(async (req, res) => {
  const page = req.query.pageNumber || 1
  const pageSize = req.query.pageSize || 20

  const totalDocuments = await Order.countDocuments({})
  const pageCount = Math.ceil(totalDocuments/pageSize)

  const orders = await Order.find({}).sort({createdAt: -1}).skip(pageSize * (page - 1)).limit(pageSize).populate('user')

  res.status(200).send({orders, pageCount})
})

const getAllOrdersForDownload = asyncHandler(async (req, res) => {

  const orders = await Order.find({}).sort({createdAt: -1}).populate('user')
  if(!orders || orders.length === 0) {
    return res.status(400).send({ message:'No Orders Found' })
  }
  res.status(200).send({orders})
})

const deleteOrder = asyncHandler(async (req, res) => {
  const { orderId  } = req.query

  const order = await Order.findById(orderId)
  if(!order) return res.status(400).send({message: 'Order not found'})

  await Order.findByIdAndDelete(orderId)
  res.status(200).send({message: "Order Delete Succesfully"})
})

const searchOrder = asyncHandler(async (req, res) => {
  const query = req.query.Query;
  const pageSize = 30;
  const page = Number(req.query.pageNumber) || 1;

  const matchCriteria = {
    $or: [
      { deliveryStatus: { $regex: query, $options: "i" } },
      { 'orderCourses.name': { $regex: query, $options: "i" } },
    ],
  };

  const ordersPipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $match: {
        $or: [
          { 'user.name': { $regex: query, $options: 'i' } },
          matchCriteria.$or[0],
          matchCriteria.$or[1],
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: pageSize * (page - 1) },
    { $limit: pageSize },
  ];

  const countPipeline = [
    ...ordersPipeline.slice(0, -2),
    { $count: 'totalOrders' },
  ];

  const [orders, countResult] = await Promise.all([
    Order.aggregate(ordersPipeline).exec(),
    Order.aggregate(countPipeline).exec(),
  ]);

  const count = countResult.length > 0 ? countResult[0].totalOrders : 0;
  const pageCount = Math.ceil(count / pageSize);

  if (!orders || orders.length === 0) {
    return res.status(404).json({ message: 'No orders found' });
  }

  res.status(200).json({
    orders,
    pageCount,
  });
});



module.exports = {
    createCourseOrder,
    getAllOrders,
    deleteOrder,
    searchOrder,
    getAllOrdersForDownload
}