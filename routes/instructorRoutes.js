const express = require("express");
const { registerInstructor, authInstructor, getAllInstructor, fetchInstructorBySearch, deleteInstructor, updateInstructor, getPendingInstructor, getInstructorData, getInstructorSalesData, getSalesHistory, getInstructorPendingData, getTopInstructors, getInstructorDataById, verifyInstructorProfile, resetPassword, getInstructorById} = require("../controller/instructiorController");
const { instructor, isAdminorInstructor } = require("../middleware/authMiddleware");
const {  generateLiveStreamToken } = require("../middleware/meetingLinkGenerate");


const router = express.Router();


router.route("/register").post(registerInstructor);
router.route("/verify-instructor-profile").post(verifyInstructorProfile);
router.route("/login").post(authInstructor);
router.route("/get-all").get(getAllInstructor)
router.route("/pending-instructor").get(getPendingInstructor);
router.route("/search").get(fetchInstructorBySearch)
router.route("/delete").delete(deleteInstructor)
router.route("/update-instructor-profile").post(instructor, updateInstructor)
router.route("/get-instructor-data").get(getInstructorData)
router.route("/get-instructor-by-id").get(getInstructorById)
router.route("/get-instructor-pending-data").get(getInstructorPendingData)
router.route("/get-instructor-sales-data").get(getInstructorSalesData)
router.route("/get-sales-history").get(getSalesHistory)
router.route("/reset-password").post(resetPassword);
router.route("/top-instructor").get(getTopInstructors) // Top Instructor Route
router.route("/get-instructor-related-data").get(getInstructorDataById) // Get Instructor Data By Id Route

module.exports = router;
