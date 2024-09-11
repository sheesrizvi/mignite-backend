const express = require("express");
const { registerUser, authUser } = require("../controller/userController");
const { isUser } = require("../middleware/authMiddleware");


const router = express.Router();

//admin
router.route("/register").post(registerUser);
router.route("/login").post(authUser);




module.exports = router;
