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
  getAllCoursesByType,
  searchAllCourses,
  topPickCourses,
  topPickCoursesByCategory,
  getPendingCourses
} = require("../controller/courseController");

const router = express.Router();
//need to create a middleware for admin and instructor both
router.route("/create").post(createCourse);
router.route("/update").post(updateCourse);
router.route("/get-all").get(getCourses);
router.route("/get-pending-courses").get(getPendingCourses);
router.route("/by-id").get(getCourseById)
router.route("/get-all-for-admin").get(getAllCoursesForAdmin);
router.route("/by-instructor-for-admin").get(getAllCoursesOfInstructorForAdmin)
router.route("/search-by-instructor-for-admin").get(searchCoursesWithinInstructor)
router.route("/search-courses").get(searchCourses)
router.route("/by-category").get(getCoursesByCategory);
router.route("/by-instructor").get(getCoursesByInstructor);
router.route("/delete").delete(deleteCourse);
router.route("/get-courses-by-category-type").get(getAllCoursesByType)
router.route("/search-all-courses").get(searchAllCourses)
router.route("/top-pick-courses").get(topPickCourses)
router.route("/top-pick-courses-by-category").get(topPickCoursesByCategory)
module.exports = router;

