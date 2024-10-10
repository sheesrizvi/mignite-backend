const asyncHandler = require('express-async-handler')
const Instructor = require('../models/instructorModel')
const Coupon = require('../models/couponModel')
const Admin = require('../models/adminModel')

const createCoupon = asyncHandler(async (req, res) => {
    let { instructorId, adminId, discountType, discount, usageLimit, startDate, expiryDate, isActive, courses } = req.body
    let code

    if(instructorId && !adminId) {
        const instructor = await Instructor.findById(instructorId)
        if(!instructor) return res.status(400).send({message: "Instructor not found"})
        const getInitials = (value) => { 
           return value.split(' ').map(word => word[0].toUpperCase()).join('')
        }
        const generateUniqueId = () => Math.random().toString(36).substring(2, 7).toUpperCase();
        code = `${getInitials(instructor.name)}-${discount.toString()}${getInitials(discountType)}-${generateUniqueId()}`
    }
    if(adminId && !instructorId) {
        const admin = await Admin.findById(adminId)
        if(!admin) return res.status(400).send({message: "Admin not found"})
        const getInitials = (value) => { 
           return value.split(' ').map(word => word[0].toUpperCase()).join('')
        }
        const generateUniqueId = () => Math.random().toString(36).substring(2, 7).toUpperCase();
        code = `${getInitials(admin.name)}-${discount.toString()}${getInitials(discountType)}-${generateUniqueId()}`
    }
        

   if((!courses || courses.length === 0) && !adminId) {

    const instructorDetails = await Instructor.findById(instructorId).populate('courses')
    const coursesIds = instructorDetails.courses
    const courseIds = coursesIds.map(course => ({ course: course._id, courseType: 'Course' }))
    const liveInstructorDetails = await Instructor.findById(instructorId).populate('livecourses')
    const livecourses = liveInstructorDetails.livecourses
    const livecourseIds = await livecourses.map(livecourse => ({course: livecourse._id, courseType: 'LiveCourse'}))
    courses = [...courseIds, ...livecourseIds]
   }

    const coupon = await Coupon.create({
        instructor: instructorId,
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
    let {couponId, instructorId, adminId, discountType, discount, usageLimit, startDate, expiryDate, isActive, courses } = req.body
    let coupon
    if(instructorId) {
        coupon = await Coupon.findOne({_id: couponId, instructor: instructorId})
        if(!coupon) return res.status(400).send({coupon})
    }
    if(adminId) {
        coupon = await Coupon.findOne({_id: couponId, admin: adminId})
        if(!coupon) return res.status(400).send({coupon})
    }
    
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
        path: 'instructor',
        populate: {
            path: 'courses'
        }
    }).populate({
        path: 'courses.course'
    })
    if(!coupon) return res.status(400).send({message: 'Coupon not found'})
   
    const isValid = coupon.isValid()
    if(!isValid) {
        return res.status(400).send({message: "Coupon is not valid"})
    }
    res.status(200).send({message: 'Coupon is valid', coupon})
})



const getCouponByCode = asyncHandler(async(req, res) => {
    const { code } = req.query
    const coupon = await Coupon.findOne({code}).populate('user admin').populate({
        path: 'instructor',
        populate: {
            path: 'courses'
        }
    }).populate({
        path: 'courses.course'
    })

    if(!coupon) return res.status(400).send({message: 'Coupon not found'})
    const isValid = coupon.isValid()
    if(!isValid) {  return  res.status(400).send({message: 'Coupon is invalid. Attaching Details', coupon})}

    res.status(200).send({message: 'Coupon is valid', coupon})
})

const getCouponsByInstructor = asyncHandler(async (req, res) => {
    const { instructorId } = req.query
    
    const now = Date.now()

    const allCoupons = await Coupon.find({instructor: instructorId}).populate('user admin').populate({
        path: 'instructor',
        populate: {
            path: 'courses'
        }
    }).populate({
        path: 'courses.course'
    })

    const activeCoupons = await Coupon.find({
        instructor: instructorId,
        startDate: { $lte: now },
        expiryDate: { $gte: now },
        isActive: true,
        $expr: {$or: [
            {$eq: ['$usageLimit', null ]},
            { $lte: ['$usageCount', '$usageLimit'] }
        ]},
    }).populate('user admin').populate({
        path: 'instructor',
        populate: {
            path: 'courses'
        }
    }).populate({
        path: 'courses.course'
    })

    if(allCoupons.length === 0) return res.status(400).send({message: "coupons not found for this Instructor"})
    res.status(200).send({message: 'Coupons found', allCoupons, activeCoupons})
})

const getCouponsByCourse = asyncHandler(async (req, res) => {
    const { course } = req.query
    const now = Date.now()
    const allCourseCoupons = await Coupon.find({
        'courses.course': course,
    }).populate('user admin').populate({
        path: 'instructor',
        populate: {
            path: 'courses'
        }
    }).populate({
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
        path: 'instructor',
        populate: {
            path: 'courses'
        }
    }).populate({
        path: 'courses.course'
    })

    if(allCourseCoupons.length === 0) return res.status(400).send({message: "Coupons not found for this course"})
    res.status(200).send({message: 'Active Coupons', allCourseCoupons, activeCourseCoupons})
})


const deleteCoupons = asyncHandler(async (req, res) => {
  const { couponId, instructorId, adminId } = req.query
  
  if( instructorId && !adminId) {
    const couponToDelete = await Coupon.findOne({_id: couponId, instructor:instructorId})
    if(!couponToDelete) return res.status(400).send({message: "No coupon found for delete"})
  }
  if(adminId && !instructorId) {
    const couponToDelete = await Coupon.findOne({_id: couponId, admin: adminId})
    if(!couponToDelete) return res.status(400).send({message: "No coupon found for delete"})
  }


  await Coupon.findByIdAndDelete(couponId)

  res.status(200).send({message: "Coupon deleted succesfully"})
})

const applyCouponToOrders = asyncHandler(async (req, res) => {
    const { code, course, userId } = req.query
    const now = Date.now()
    console.log(code, course, userId)
    const coupon = await Coupon.findOne({
        code,
        startDate: { $lte: now },
        expiryDate: { $gte: now },
        isActive: true,
        $expr: {
            $or:[
                { $eq: [ '$usageLimit', null ] },
                { $lte: [ '$usageCount', '$usageLimit' ] }
            ]
        }
    }).populate('user admin').populate({
        path: 'instructor',
        populate: {
            path: 'courses'
        }
    }).populate({
        path: 'courses.course'
    })

    if(!coupon) {
        return res.status(400).send({message: 'coupon not found or inactive'})
    }

    if (!userId || coupon.user.includes(userId)) {
        return res.status(400).send({message: 'Coupon already used by user or user id not provided'})
    }
   
    if(coupon.admin) {
        const couponCode = coupon.code
        const discountType = coupon.discountType
        const discount = coupon.discount 
        return res.status(200).send({message: 'Coupon Details found', discount, discountType, couponCode, coupon})
    }

    const courseExistInCoupon = await coupon.courses.some(c => c.course && c.course.equals(course))
    if(!courseExistInCoupon) {
        return res.status(400).send({message: 'course not found in coupon'})
    } 
    
    const couponCode = coupon.code
    const discountType = coupon.discountType
    const discount = coupon.discount

    res.status(200).send({message: 'Coupon Details found', discount, discountType, couponCode, coupon})
})

const getCouponsUsedbyUser = asyncHandler(async (req, res) => {
    const { userId } = req.query
    const coupons = await Coupon.find({ user: { $in: [userId] }}).populate('user admin').populate({
        path: 'instructor',
        populate: {
            path: 'courses'
        }
    }).populate({
        path: 'courses.course'
    })

    if(!coupons || coupons.length === 0) return res.status(400).send({message: "Coupons not found for user"})
    
    res.status(200).send({message:'Coupons used by user', coupons})
    
})

module.exports = {
    createCoupon,
    checkCouponValidity,
    updateCouponDetails,
    getCouponsByInstructor,
    getCouponsByCourse,
    deleteCoupons,
    applyCouponToOrders,
    getCouponByCode,
    getCouponsUsedbyUser
}