const express = require("express");
const { instructor } = require("../middleware/authMiddleware");
const { startLiveMeeting, endLiveMeeting } = require("../controller/meetingController");
const { generateTokenStream } = require("../utils/generateToken");
const { generateLiveStreamToken } = require("../middleware/meetingLinkGenerate");
const router = express.Router();

router.route("/start-meeting").get(instructor, startLiveMeeting);
router.route("/end-meeting").get(instructor, endLiveMeeting);
router.route("/generate-meeting-token").get(generateLiveStreamToken)
module.exports = router;
