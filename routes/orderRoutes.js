const express = require("express");
const { isUser } = require("../middleware/authMiddleware");
const { createCourseOrder } = require("../controller/orderController");
const router = express.Router()


router.route("/purchase-course").post(isUser, createCourseOrder);

module.exports = router;
