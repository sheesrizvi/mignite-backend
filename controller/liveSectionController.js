const asyncHandler = require("express-async-handler");
const Section = require("../models/sectionModel");
const Course = require("../models/coursesModel");
const Assignment = require("../models/assignmentModel");
const LiveCourse = require("../models/liveCourseModel");
const LiveSection = require("../models/liveSectionModel");
const { createMeeting } = require("../middleware/meetingLinkGenerate");

const createLiveSection = asyncHandler(async (req, res) => {

  const instructor = req.user
  const {
    liveCourse,
    name,
    description,
    type,
    srNumber,
    startTime,
    endTime,
    duration,
  } = req.body;

  if(!liveCourse || !name || !description || !type || !srNumber || !startTime || !endTime || !duration) {
    return res.status(400).send({status: true, message: "All Fields are required!"})
  }

  if (type == "live") {

    const {callId, meetingData} = await createMeeting(instructor._id, startTime)
    const section = await LiveSection.create({
        liveCourse,
        name,
        description,
        type,
        srNumber,
        link: callId,
        startTime,
        endTime,
        duration,
        instructor: instructor._id
    });

    if (section) {
      const updateCourse = await LiveCourse.findOneAndUpdate(
        { _id: liveCourse },
        { $push: { liveSections: section._id } }
      );
      res.status(201).json(section);
    } else {
      res.status(404);
      throw new Error("Error");
    }
  } else {
    const assignment = await Assignment.create({
      name,
      course,
      level,
      number,
      questions
    })
    const section = await Section.create({
      name,
      course,
      description,
      srNumber,
      assignment,
    });
    if (section) {
      const updateCourse = await LiveCourse.update(
        { _id: course },
        { $push: { liveSections: section._id } }
      );
      res.status(201).json(section);
    } else {
      res.status(404);
      throw new Error("Error");
    }
  }
});


const getLiveSectionsByCourse = asyncHandler(async (req, res) => {
  const { course } = req.query;
  if (!course) {
    res.status(400).json({ message: "Course ID is required" });
    return;
  }
  const sections = await LiveSection.find({ liveCourse: course })
    .populate("liveCourse")
    .sort({srNumber : 1})
  if (sections) {
    res.status(201).json(sections);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});

const deleteLiveSection = asyncHandler(async (req, res) => {
    const { sectionId } = req.params
    const instructor = req.user;
    if(!sectionId) {
        return res.status(400).send({status: false, message: 'Please provide sectionId'})
    }
    const liveSectionDetails = await LiveSection.findById(sectionId) 
    if(!liveSectionDetails) {
     return res.status(400).send({status: false, message: 'No Live Section Found '})
    }
    if(liveSectionDetails.instructor.toString() !== instructor._id.toString()) {
                return res.status(400).send({status: false, message: 'Instructor not authorized to delete this section'})
              }
    await LiveSection.findByIdAndDelete(sectionId)
    await LiveCourse.findOneAndUpdate(
        { _id: liveSectionDetails.liveCourse },
        { $pull: { liveSections: sectionId } }
      );
    return res.status(200).send({status: true, message: 'Section deleted successfully'})
})

const editLiveSection = asyncHandler(async (req, res) => {
    const instructor = req.user;
   
    const {
        sectionId,
        liveCourse,
        name,
        description,
        type,
        srNumber,
        startTime,
        endTime,
        duration,
      } = req.body;
      const livesectionObj = await LiveSection.findById(sectionId)
    
      if(!livesectionObj) {
        return res.status(400).send({status: true, message: 'Live Section not found for this section id'})
      }
      if(livesectionObj.instructor.toString() !== instructor._id.toString()) {
        return res.status(400).send({status: false, message: 'Instructor not authorized to update this section'})
      }
      if(type === "live") {

        let updatedFields = {
            liveCourse: liveCourse || livesectionObj.liveCourse,
            name: name || livesectionObj.name,
            description: description || livesectionObj.description,
            type: type || livesectionObj.type,
            srNumber: srNumber || livesectionObj.srNumber,
            startTime: startTime || livesectionObj.startTime,
            endTime: endTime || livesectionObj.endTime,
            duration: duration || livesectionObj.duration,
          };
          if (startTime && startTime !== section.startTime) {
            const { callId } = await createMeeting(instructor._id, startTime);
            updatedFields.link = callId; 
          }

        section = await LiveSection.findByIdAndUpdate(sectionId, updatedFields, { new: true });

        if (section) {
            res.status(200).send({ status: true, message: "Section updated", section });
          } else {
            res.status(500).send({ status: false, message: "Error updating section" });
          } 
    }

})

const getLiveSectionDetails = asyncHandler(async (req, res) => {
   const { sectionId } = req.query
   if(!sectionId) {
    return res.status(400).send({status: false, message: 'Please provide sectionId'})
   }
   const liveSectionDetails = await LiveSection.findById(sectionId) 
   if(!liveSectionDetails) {
    return res.status(400).send({status: false, message: 'No Live Section Found '})
   }
   res.status(200).send({status: true, message: 'Live Section Found', liveSection: liveSectionDetails}) 
})

module.exports = {
  createLiveSection,
  deleteLiveSection,
  getLiveSectionsByCourse,
  getLiveSectionDetails,
  editLiveSection
};
