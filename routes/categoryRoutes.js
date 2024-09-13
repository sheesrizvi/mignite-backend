const express = require("express");
const { createCategory, getCategory, getCategoryByType, deleteCategory, updateCategory } = require("../controller/categoryController");
const { admin } = require("../middleware/authMiddleware");



const router = express.Router();
router.route("/create").post(admin, createCategory);
router.route("/update").patch(admin, updateCategory);
router.route("/get-all").get(getCategory);
router.route("/by-type").get(getCategoryByType);
router.route("/delete").delete(admin, deleteCategory);

module.exports = router;

