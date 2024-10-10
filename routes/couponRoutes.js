const express = require('express')
const { createCoupon,
    checkCouponValidity,
    updateCouponDetails,
    getCouponsByInstructor,
    getCouponsByCourse,
    deleteCoupons,
    applyCouponToOrders,
    getCouponByCode, 
    getCouponsUsedbyUser} = require('../controller/couponController')
const { isAdminorInstructor } = require('../middleware/authMiddleware')
const router = express.Router()

// Protected
router.post('/add-coupon' , isAdminorInstructor, createCoupon)
router.post('/update-coupon',isAdminorInstructor,  updateCouponDetails)
router.delete('/delete/coupon',isAdminorInstructor,  deleteCoupons)
// Public
router.get('/check-coupon-validity', checkCouponValidity)
router.get('/get-instructor-active-coupons', getCouponsByInstructor)
router.get('/get-course-active-coupons', getCouponsByCourse)
router.get('/apply-coupon-to-order', applyCouponToOrders)
router.get('/get-coupon-by-code', getCouponByCode)
router.get('/get-coupons-used-by-user', getCouponsUsedbyUser)

module.exports = router