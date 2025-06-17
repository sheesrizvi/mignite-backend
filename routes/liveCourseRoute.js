const express = require("express");
const {
    createLiveCourse,
    getLiveCourses,
    getLiveCoursesByCategory,
    updateLiveCourse,
    deleteLiveCourse,
    getLiveCoursesByInstructor,
    deleteAllLiveCourses,
    getAllLiveCoursesForAdmin,
    searchLiveCourse,
    searchLiveCoursesWithinInstructor,
    getAllLiveCoursesOfInstructorForAdmin,
    getLiveCourseById,
    getAllPendingLiveCoursesForAdmin,
    searchPendingLiveCourse,
    getLiveCoursesByInstructorForInstructorPanel
} = require("../controller/liveCourseController");
const { instructor, admin } = require("../middleware/authMiddleware.js");


const router = express.Router();
//need to create a middleware for admin and instructor both
router.route("/create").post(instructor, createLiveCourse);
router.route("/update/:id").patch(instructor, updateLiveCourse);
router.route("/get-all").get(getLiveCourses);
router.route("/get-all-live-courses").get(getAllLiveCoursesForAdmin);
router.route("/get-all-pending-live-courses").get(getAllPendingLiveCoursesForAdmin);
router.route("/by-id").get(getLiveCourseById)
router.route("/search-live-courses").get(searchLiveCourse)
router.route("/search-pending-live-courses").get(searchPendingLiveCourse)
router.route("/by-instructor-for-admin").get(getAllLiveCoursesOfInstructorForAdmin);
router.route("/search-by-instructor-for-admin").get(searchLiveCoursesWithinInstructor)
router.route("/by-category").get(getLiveCoursesByCategory);
router.route("/by-instructor").get(getLiveCoursesByInstructor);
router.route("/by-instructor-for-instructor-panel").get(getLiveCoursesByInstructorForInstructorPanel);
router.route("/delete").delete(deleteLiveCourse);
router.route("/delete-all").delete(admin, deleteAllLiveCourses)
module.exports = router;
