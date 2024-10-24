const express = require('express')
const { createCoupon,
    checkCouponValidity,
    updateCouponDetails,
    getCouponsByInstructor,
    getCouponsByCourse,
    deleteCoupons,
    applyCouponToOrders,
    getCouponByCode, 
    getCouponsUsedbyUser,
    getPlatformCoupons,
    getAllCoupons,
    searchCoupons,
    deleteAllCoupons} = require('../controller/couponController')
const {  admin } = require('../middleware/authMiddleware')
const router = express.Router()

// Protected
router.post('/add-coupon' , admin, createCoupon)
router.post('/update-coupon',admin,  updateCouponDetails)
router.delete('/delete/coupon',admin,  deleteCoupons)

// Public
router.get('/check-coupon-validity', checkCouponValidity) // check coupon validity


router.get('/get-platform-coupons', getPlatformCoupons)// platform coupon
router.get('/get-course-active-coupons', getCouponsByCourse) // course details page or course card badge
router.get('/apply-coupon-to-order', applyCouponToOrders) // order checkout page- couponCode, user, courses
router.get('/get-coupons-used-by-user', getCouponsUsedbyUser)  // coupons used by user
router.get('/get-coupons-by-instructor', getCouponsByInstructor) // coupons by instructor
router.get('/get-all', getAllCoupons) // get all coupons
router.get('/search-all-coupons', searchCoupons)
router.delete("/delete-all-coupons", deleteAllCoupons)
router.delete("/delete-coupon-by-id", deleteCoupons)

module.exports = router