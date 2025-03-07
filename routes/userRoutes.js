const express = require("express");
const { registerUser, authUser, getUserDetails, getCoursesBoughtByUser, getSubscriptionByUser, updateUserProfile, resetPassword, verifyUserProfile, deleteUser } = require("../controller/userController");
const { isUser } = require("../middleware/authMiddleware");
const { verifyTransporter } = require("../middleware/handleEmail.js");


const router = express.Router();
resetPassword
//admin
router.route("/register").post(registerUser);
router.route("/login").post(authUser);
router.route("/get-user").get(isUser, getUserDetails)
router.route("/courses-bought-by-user").get(getCoursesBoughtByUser)
router.route("/subscription-by-user").get(getSubscriptionByUser)
router.route("/update-user-profile").post(isUser, updateUserProfile)
router.post('/reset-password', resetPassword)
router.route('/verify-user-profile').post(verifyUserProfile)
router.route('/delete-user').delete(deleteUser)
module.exports = router;
