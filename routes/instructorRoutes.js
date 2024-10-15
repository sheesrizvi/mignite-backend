const express = require("express");
const { registerInstructor, authInstructor, getAllInstructor, fetchInstructorBySearch, deleteInstructor, updateInstructor, getPendingInstructor, getInstructorData, getInstructorSalesData, getSalesHistory} = require("../controller/instructiorController");
const { instructor, isAdminorInstructor } = require("../middleware/authMiddleware");
const {  generateLiveStreamToken } = require("../middleware/meetingLinkGenerate");


const router = express.Router();

//admin
router.route("/register").post(registerInstructor);
router.route("/login").post(authInstructor);
router.route("/get-all").get(getAllInstructor)
router.route("/pending-instructor").get(getPendingInstructor);
router.route("/search").get(fetchInstructorBySearch)
router.route("/delete").delete(deleteInstructor)
router.route("/update-instructor-profile").post(instructor, updateInstructor)
router.route("/get-instructor-data").get(getInstructorData)
router.route("/get-instructor-sales-data").get(getInstructorSalesData)
router.route("/get-sales-history").get(getSalesHistory)

module.exports = router;
