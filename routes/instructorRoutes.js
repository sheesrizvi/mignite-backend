const express = require("express");
const { registerInstructor, authInstructor, courseMeetingLinkGenerate } = require("../controller/instructiorController");
const { instructor } = require("../middleware/authMiddleware");
const {  generateLiveStreamToken } = require("../middleware/meetingLinkGenerate");


const router = express.Router();

//admin
router.route("/register").post(registerInstructor);
router.route("/login").post(authInstructor);

//seller
//router.get('/generateUserToken/:id', generateLiveStreamToken)
router.post('/createmeeting/:courseId', instructor,  courseMeetingLinkGenerate)

module.exports = router;
