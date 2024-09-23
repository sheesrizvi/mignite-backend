const express = require("express");
const { registerUser, authUser, getUserDetails } = require("../controller/userController");
const { isUser } = require("../middleware/authMiddleware");


const router = express.Router();

//admin
router.route("/register").post(registerUser);
router.route("/login").post(authUser);
router.route("/get-user").get(isUser, getUserDetails)



module.exports = router;
