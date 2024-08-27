const asyncHandler = require("express-async-handler");
const Course = require("../models/coursesModel");
const Section = require("../models/sectionModel");

const createCourse = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    instructor,
    image,
    details,
    description,
    price,
    requirement,
  } = req.body;

  const course = await Course.create({
    name,
    category,
    instructor,
    image,
    details,
    description,
    price,
    requirement,
  });
  if (course) {
    res.status(201).json(course);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});
const getCoursesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const courses = await Course.find({ category: category });
  if (courses) {
    res.status(201).json(courses);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});
const getCoursesByInstructor = asyncHandler(async (req, res) => {
  const { instructor } = req.query;

  const courses = await Course.find({ instructor: instructor });
  if (courses) {
    res.status(201).json(courses);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});
const getCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({});
  if (courses) {
    res.status(201).json(courses);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});
const deleteCourse = asyncHandler(async (req, res) => {
  const subid = req.query.id;
  const sub = await Course.findById(subid);

  const f1 = sub.image;

  if (f1) {
    const fileName = f1.split("//")[1].split("/")[1];

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: fileName,
    });
    const response = await s3.send(command);
  }
  /// need to delete inside section or dont allow user to delete course but sections
  await Section.deleteMany({ course: req.query.id });
  await Course.deleteOne({ _id: req.query.id });
  res.json("deleted");
});
const updateCourse = asyncHandler(async (req, res) => {
  const {
    id,
    name,
    category,
    instructor,
    image,
    details,
    description,
    price,
    requirement,
  } = req.body;
  const course = await Course.findById({ id });
  if (course) {
    course.name == name;
    course.price == price;
    course.requirement = requirement;
    course.details == details;
    course.description == description;
    course.instructor == instructor;
    course.category == category;
    course.image == image ? image : course.image;
    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});

module.exports = {
  createCourse,
  getCourses,
  getCoursesByInstructor,
  getCoursesByCategory,
  updateCourse,
  deleteCourse
};
