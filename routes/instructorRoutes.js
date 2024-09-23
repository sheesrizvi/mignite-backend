const express = require("express");
const { registerInstructor, authInstructor, getAllInstructor, fetchInstructorBySearch, deleteInstructor} = require("../controller/instructiorController");
const { instructor, isAdminorInstructor } = require("../middleware/authMiddleware");
const {  generateLiveStreamToken } = require("../middleware/meetingLinkGenerate");


const router = express.Router();

//admin
router.route("/register").post(registerInstructor);
router.route("/login").post(authInstructor);
router.route("/get-all").get(getAllInstructor)
router.route("/search").get(fetchInstructorBySearch)
router.route("/delete").delete(isAdminorInstructor ,deleteInstructor)
module.exports = router;
