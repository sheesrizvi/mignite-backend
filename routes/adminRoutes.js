const express = require("express");
const { registerAdmin, authAdmin,
    updateInstructorStatus,
    updateCourseStatus,
    updateLiveCourseStatus,
    updateSectionController, 
    updateAllModuleStatus} = require("../controller/adminController");


const router = express.Router();

//admin
router.route("/register").post(registerAdmin);
router.route("/login").post(authAdmin);

//seller
router.route("/update-instructor-status").post(updateInstructorStatus)
router.route("/update-course-status").post(updateCourseStatus)
router.route("/update-livecourse-status").post(updateLiveCourseStatus)
router.route("/update-section-status").post(updateSectionController)
router.route("/update-approved-field").post(updateAllModuleStatus)
module.exports = router;
