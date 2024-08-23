const express = require("express");
const {
  createCourse,
  getCourses,
  getCoursesByCategory,
  getCoursesByInstructor,
  deleteCourse,
  updateCourse,
} = require("../controller/courseController");

const router = express.Router();
//need to create a middleware for admin and instructor both
router.route("/create").post(createCourse);
router.route("/update").post(updateCourse);
router.route("/get-all").get(getCourses);
router.route("/by-category").get(getCoursesByCategory);
router.route("/by-instructor").get(getCoursesByInstructor);
router.route("/delete").delete(deleteCourse);

module.exports = router;

