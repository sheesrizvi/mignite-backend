const express = require("express");
const {
  createSection,
  getSectionsByCourse,
  deleteSection,
} = require("../controller/sectionController");

const router = express.Router();
//need to create a middleware for admin and instructor both
router.route("/create").post(createSection);
router.route("/get").get(getSectionsByCourse);

router.route("/delete").delete(deleteSection);

module.exports = router;

