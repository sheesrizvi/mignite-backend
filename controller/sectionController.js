const asyncHandler = require("express-async-handler");
const Section = require("../models/sectionModel");
const Course = require("../models/coursesModel");
const Assignment = require("../models/assignmentModel");

const createSection = asyncHandler(async (req, res) => {
  const {
    name,
    course,
    description,
    type,
    srNumber,
    video,
    level,
    number,
    questions,
  } = req.body;
  if (video && type == "video") {
    const section = await Section.create({
      name,
      course,
      description,
      type,
      srNumber,
      video,
    });

    if (section) {
      const updateCourse = await Course.update(
        { _id: course },
        { $push: { sections: section._id } }
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
      const updateCourse = await Course.update(
        { _id: course },
        { $push: { sections: section._id } }
      );
      res.status(201).json(section);
    } else {
      res.status(404);
      throw new Error("Error");
    }
  }
});
const getSectionsByCourse = asyncHandler(async (req, res) => {
  const { course } = req.query;

  const sections = await Section.find({ course: course })
    .populate("assignment")
    .sort(srNumber);
  if (sections) {
    res.status(201).json(sections);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});

const deleteSection = asyncHandler(async (req, res) => {
  const subid = req.query.id;
  const sub = await Section.findById(subid);

  const f1 = sub.video;
  // delete video algorithm
  if (f1) {
    const fileName = f1.split("//")[1].split("/")[1];

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: fileName,
    });
    const response = await s3.send(command);
  }
  /// need to delete inside section or dont allow user to delete course but sections
  await Section.deleteOne({ course: req.query.id });
  const updateCourse = await Course.update(
    { _id: sub.course },
    { $pull: { sections: sub._id } }
  );
  res.json("deleted");
});

module.exports = {
  createSection,
  getSectionsByCourse,
  deleteSection,
};
