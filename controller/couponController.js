const asyncHandler = require('express-async-handler')
const Coupon = require('../models/couponModel')
const Admin = require('../models/adminModel')
const mongoose = require('mongoose')

const createCoupon = asyncHandler(async (req, res) => {
    let {adminId, discountType, discount, usageLimit, startDate, expiryDate, isActive, courses } = req.body
    let code
       
        const admin = await Admin.findById(adminId)
        if(!admin) return res.status(400).send({message: "Admin not found"})
        const getInitials = (value) => { 
           return value.split(' ').map(word => word[0].toUpperCase()).join('')
        }
        const generateUniqueId = () => Math.random().toString(36).substring(2, 7).toUpperCase();
        code = `${getInitials(admin.name)}-${discount.toString()}${getInitials(discountType)}-${generateUniqueId()}`
    
        
    const coupon = await Coupon.create({
        admin: adminId,
        code,
        discountType,
        discount,
        usageLimit,
        startDate,
        expiryDate,
        isActive,
        courses: courses || []
    })

    res.status(200).send({message: 'Coupon generated succesfull', coupon})
})


const updateCouponDetails = asyncHandler(async (req, res) => {
    let {couponId, adminId, discountType, discount, usageLimit, startDate, expiryDate, isActive, courses } = req.body
    let coupon
    
    if(!couponId || !adminId) {
        return res.status(400).send({message: 'Both Fields are required'})
    }
        coupon = await Coupon.findOne({_id: couponId})
        if(!coupon) return res.status(400).send({coupon})
    

    coupon.discountType = discountType || coupon.discountType
    coupon.discount = discount || coupon.discount
    coupon.usageLimit = usageLimit || coupon.usageLimit
    coupon.startDate = startDate || coupon.startDate
    coupon.expiryDate = expiryDate || coupon.expiryDate
    coupon.isActive = isActive || coupon.isActive,
    coupon.courses = courses || (coupon.courses || [])

    await coupon.save()
    res.status(200).send({message: 'Coupon updated succesfully', coupon})
})



const checkCouponValidity = asyncHandler(async (req, res) => {
    const { code } = req.query
    const coupon = await Coupon.findOne({code}).populate('user admin').populate({
        path: 'courses.course'
    })
    if(!coupon) return res.status(400).send({message: 'Coupon not found'})
   
    const isValid = coupon.isValid()
    if(!isValid) {
        return res.status(400).send({message: "Coupon is not valid"})
    }
    res.status(200).send({message: 'Coupon is valid', coupon})
})




const getCouponsByCourse = asyncHandler(async (req, res) => {
    const { course } = req.query
    const now = Date.now()
    const allCourseCoupons = await Coupon.find({
        'courses.course': course,
    }).populate('user admin').populate({
        path: 'courses.course'
    })

    const activeCourseCoupons = await Coupon.find({
        'courses.course': course,
        startDate: { $lte: now },
        expiryDate: { $gte: now },
        isActive: true,
        $expr: {$or: [
            {$eq: ['$usageLimit', null ]},
            { $lte: ['$usageCount', '$usageLimit'] }
        ]},
    }).populate('user admin').populate({
        path: 'courses.course'
    })

    const coupons = await Coupon.find({
        $or: [
            { courses: { $exists: false } },
            { courses: { $eq: [] } } 
        ],
        startDate: { $lte: now },
        expiryDate: { $gte: now },
        isActive: true,
        $expr: {
            $or:[
                { $eq: [ '$usageLimit', null ] },
                { $lt: [ '$usageCount', '$usageLimit' ] }
            ]
        }

       
    })

    const allCoupons = await Coupon.find({
        $or: [
            { courses: { $exists: false } },
            { courses: { $eq: [] } } 
        ],  
    })


   // if(allCourseCoupons.length === 0) return res.status(400).send({message: "Coupons not found for this course"})
    res.status(200).send({message: 'Active Coupons', allCourseCoupons, activeCourseCoupons,activePlatformCoupons: coupons, allPlatformCoupons: allCoupons})
})


const deleteCoupons = asyncHandler(async (req, res) => {
  const { couponId } = req.query
  
  if(!couponId) {
    return res.status(400).send({message: "CouponId is required"})
  }
    const couponToDelete = await Coupon.findOne({_id: couponId})
    if(!couponToDelete) return res.status(400).send({message: "No coupon found for delete"})



  await Coupon.findByIdAndDelete(couponId)

  res.status(200).send({message: "Coupon deleted succesfully"})
})

const applyCouponToOrders = asyncHandler(async (req, res) => {
    const { code, courses, userId } = req.query
    const now = Date.now()
    
    const coupon = await Coupon.findOne({
        code,
        startDate: { $lte: now },
        expiryDate: { $gte: now },
        isActive: true,
        $expr: {
            $or:[
                { $eq: [ '$usageLimit', null ] },
                { $lt: [ '$usageCount', '$usageLimit' ] }
            ]
        }

       
    }).populate('user admin').populate({
        path: 'courses.course'
    })

    if(!coupon) {
        return res.status(400).send({message: 'coupon not found or inactive'})
    }

    if (!userId || coupon.user.toString().includes(userId)) {
        return res.status(400).send({message: 'Coupon already used by user or user id not provided'})
    }
   
   
    if(!coupon.courses || coupon.courses.length === 0) {
        const couponCode = coupon.code
        const discountType = coupon.discountType
        const discount = coupon.discount 
        return res.status(200).send({message: 'Coupon Details found', discount, discountType, couponCode, coupon})
    }

    const courseArray = Array.isArray(courses) ? courses: [courses]
    const matchingCourses = courseArray.filter(course => coupon.courses.some(c => c.course && c.course.equals(course)))

    if(matchingCourses.length === 0) return res.status(400).send({message: "Coupon not valid with these courses"})
    
    const couponCode = coupon.code
    const discountType = coupon.discountType
    const discount = coupon.discount

    res.status(200).send({message: 'Coupon Details found', discount, discountType, couponCode, coupon, matchingCourses})
})


const getPlatformCoupons = asyncHandler(async (req, res) => {
    const now = Date.now()
    const coupons = await Coupon.find({
        $or: [
            { courses: { $exists: false } },
            { courses: { $eq: [] } } 
        ],
        startDate: { $lte: now },
        expiryDate: { $gte: now },
        isActive: true,
        $expr: {
            $or:[
                { $eq: [ '$usageLimit', null ] },
                { $lt: [ '$usageCount', '$usageLimit' ] }
            ]
        }

       
    })

    const allCoupons = await Coupon.find({
        $or: [
            { courses: { $exists: false } },
            { courses: { $eq: [] } } 
        ],  
    })
    res.status(200).send({activePlatformCoupons: coupons, allPlatformCoupons: allCoupons})

})

const getAllCoupons = asyncHandler(async (req, res) => {
    const now = Date.now()
    const coupons = await Coupon.find({
        startDate: { $lte: now },
        expiryDate: { $gte: now },
        isActive: true,
        $expr: {
            $or:[
                { $eq: [ '$usageLimit', null ] },
                { $lt: [ '$usageCount', '$usageLimit' ] }
            ]
        }

       
    }).populate('user').populate({
        path: 'courses.course'
    })
    
    
    if(coupons.length === 0) return res.status(400).send({activeCoupons: coupons})

    res.status(200).send({coupons})
})

const getCouponsUsedbyUser = asyncHandler(async (req, res) => {
    let { userId } = req.query
   
    const coupons = await Coupon.find({user: userId})
    .populate('user admin').populate({
        path: 'courses.course'
    })
    

    if(!coupons || coupons.length === 0) return res.status(400).send({message: "Coupons not found for user"})
    
    res.status(200).send({message:'Coupons used by user', coupons})
    
})


const getCouponsByInstructor = asyncHandler(async (req, res) => {
    let { instructor } = req.query;
    
    if (!instructor) return res.status(400).send({ message: 'Instructor not found' });
    instructor = new mongoose.Types.ObjectId(instructor);
    const searchCriteria = [
        { $unwind: "$courses" },
        {
            $lookup: {
                from: "courses",
                localField: 'courses.course',
                foreignField: '_id',
                as: 'courseDetails'
            }
        },
        { 
            $unwind: { 
                path: '$courseDetails', 
                preserveNullAndEmptyArrays: true 
            } 
        },
        {
            $lookup: {
                from: "livecourses",
                localField: 'courses.course',
                foreignField: '_id',
                as: 'liveCourseDetails'
            }
        },
        { 
            $unwind: { 
                path: '$liveCourseDetails', 
                preserveNullAndEmptyArrays: true 
            } 
        },
       
        {
            $match: {
                $or: [
                    { 'courseDetails.instructor': instructor },
                    { 'liveCourseDetails.instructor': instructor }
                ]
            }
        },
        {
            $group: {
                _id: "$_id",
                code: { $first: "$code" },
                discountType: { $first: "$discountType" },
                usageCount: { $first: "$usageCount" },
                usageLimit: { $first: "$usageLimit" },
                isActive: { $first: "$isActive" },
                discount: { $first: "$discount" },
                courses: { $push: "$courses" },
                courseDetails: { $addToSet: "$courseDetails" },
                liveCourseDetails: { $addToSet: "$liveCourseDetails" }
            }
        }
    ];

    const coupons = await Coupon.aggregate(searchCriteria);
    res.status(200).send({ coupons });
});


module.exports = {
    createCoupon,
    checkCouponValidity,
    updateCouponDetails,
    getCouponsByCourse,
    getAllCoupons,
    deleteCoupons,
    applyCouponToOrders,
    getCouponsUsedbyUser,
    getCouponsByInstructor,
    getPlatformCoupons
}