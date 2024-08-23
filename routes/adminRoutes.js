const express = require("express");
const { registerAdmin, authAdmin } = require("../controller/adminController");


const router = express.Router();

//admin
router.route("/register").post(registerAdmin);
router.route("/login").post(authAdmin);

//seller


module.exports = router;
