const express = require("express");
const {
  createCourse,
  getCourses,
  getCoursesByCategory,
  getCoursesByInstructor,
  deleteCourse,
  updateCourse,
  getAllCoursesForAdmin,
  getAllCoursesOfInstructorForAdmin,
  searchCoursesWithinInstructor,
  searchCourses,
  getCourseById,
} = require("../controller/courseController");

const router = express.Router();
//need to create a middleware for admin and instructor both
router.route("/create").post(createCourse);
router.route("/update").post(updateCourse);
router.route("/get-all").get(getCourses);
router.route("/by-id").get(getCourseById)
router.route("/get-all-for-admin").get(getAllCoursesForAdmin);
router.route("/by-instructor-for-admin").get(getAllCoursesOfInstructorForAdmin)
router.route("/search-by-instructor-for-admin").get(searchCoursesWithinInstructor)
router.route("/search-courses").get(searchCourses)
router.route("/by-category").get(getCoursesByCategory);
router.route("/by-instructor").get(getCoursesByInstructor);
router.route("/delete").delete(deleteCourse);


module.exports = router;

