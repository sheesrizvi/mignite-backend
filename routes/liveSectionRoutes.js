const express = require("express");
const { instructor } = require("../middleware/authMiddleware");
const { createLiveSection, getLiveSectionsByCourse, getLiveSectionDetails, deleteLiveSection } = require("../controller/liveSectionController");

const router = express.Router();

router.route("/create").post(instructor, createLiveSection);
router.route("/getbycourse").get(getLiveSectionsByCourse);
router.route("/get-specific").get(getLiveSectionDetails)
router.route("/:sectionId").delete(instructor, deleteLiveSection)
module.exports = router;
