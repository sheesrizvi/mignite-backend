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
const {  admin } = require('../middleware/authMiddleware')
const router = express.Router()

// Protected
router.post('/add-coupon' , admin, createCoupon)
router.post('/update-coupon',admin,  updateCouponDetails)
router.delete('/delete/coupon',admin,  deleteCoupons)
// Public
router.get('/check-coupon-validity', checkCouponValidity)
router.get('/get-course-active-coupons', getCouponsByCourse)
router.get('/apply-coupon-to-order', applyCouponToOrders)
router.get('/get-coupons-used-by-user', getCouponsUsedbyUser)
router.get('/get-coupons-by-instructor', getCouponsByInstructor)

module.exports = router