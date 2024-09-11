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

  const courses = await Course.find({ category: category }).populate({
    path: "sections",
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate('instructor');
  if (courses) {
    res.status(201).json(courses);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});
const getCoursesByInstructor = asyncHandler(async (req, res) => {
  const { instructor } = req.query;

  const courses = await Course.find({ instructor: instructor }).populate({
    path: "sections",
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate('instructor');
  if (courses) {
    res.status(201).json(courses);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});
const getCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({}).populate({
    path: "sections",
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate('instructor');
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
  if (sub.sections.length !== 0) {
    res.json("Delete all sections of this course first").status(404)
  } else {
    const f1 = sub.image;

    if (f1) {
      const fileName = f1.split("//")[1].split("/")[1];

      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: fileName,
      });
      const response = await s3.send(command);
    }
    await Course.deleteOne({ _id: req.query.id });
    res.json("deleted");
  }

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
