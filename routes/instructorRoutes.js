const express = require("express");
const { registerInstructor, authInstructor} = require("../controller/instructiorController");
const { instructor } = require("../middleware/authMiddleware");
const {  generateLiveStreamToken } = require("../middleware/meetingLinkGenerate");


const router = express.Router();

//admin
router.route("/register").post(registerInstructor);
router.route("/login").post(authInstructor);



module.exports = router;
