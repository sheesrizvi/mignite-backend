const express = require("express");
const { createCategory, getCategory, getCategoryByType, deleteCategory } = require("../controller/categoryController");


const router = express.Router();
router.route("/create").post(createCategory);
router.route("/get-all").get(getCategory);
router.route("/by-type").get(getCategoryByType);
router.route("/delete").delete(deleteCategory);

module.exports = router;

