const express = require("express");
const { isUser } = require("../middleware/authMiddleware");
const { createCourseOrder, getAllOrders, deleteOrder, searchOrder } = require("../controller/orderController");
const router = express.Router()


router.route("/purchase-course").post(createCourseOrder);
router.route("/get-orders").get(getAllOrders)
router.route("/delete-order").delete(deleteOrder)
router.route("/search-order").get(searchOrder)

module.exports = router;
