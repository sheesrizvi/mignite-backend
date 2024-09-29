const express = require("express");
const { instructor, admin } = require("../middleware/authMiddleware");
const { createLiveSection, getLiveSectionsByCourse, getLiveSectionDetails, deleteLiveSection, editLiveSection, deleteAllLiveSection } = require("../controller/liveSectionController");

const router = express.Router();


router.route("/create").post(instructor, createLiveSection);
router.route("/getbycourse").get(getLiveSectionsByCourse);
router.route("/get-specific").get(getLiveSectionDetails)
router.route("/delete").delete(instructor, deleteLiveSection)
router.route("/update").patch(instructor, editLiveSection)

module.exports = router;
