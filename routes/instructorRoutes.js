const express = require("express");
const { registerInstructor, authInstructor } = require("../controller/instructiorController");


const router = express.Router();

//admin
router.route("/register").post(registerInstructor);
router.route("/login").post(authInstructor);

//seller


module.exports = router;
