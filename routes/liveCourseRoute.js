const express = require("express");
const {
    createLiveCourse,
    getLiveCourses,
    getLiveCoursesByCategory,
    updateLiveCourse,
    deleteLiveCourse,
    getLiveCoursesByInstructor,
} = require("../controller/liveCourseController");
const { instructor } = require("../middleware/authMiddleware");

const router = express.Router();
//need to create a middleware for admin and instructor both
router.route("/create").post(instructor, createLiveCourse);
router.route("/update/:id").patch(instructor, updateLiveCourse);
router.route("/get-all").get(getLiveCourses);
router.route("/by-category").get(getLiveCoursesByCategory);
router.route("/by-instructor").get(getLiveCoursesByInstructor);
router.route("/delete").delete(instructor, deleteLiveCourse);

module.exports = router;
