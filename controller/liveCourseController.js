const asyncHandler = require("express-async-handler");
const LiveCourse = require("../models/liveCourseModel");
const { instructor } = require("../middleware/authMiddleware");

const createLiveCourse = asyncHandler(async (req, res) => {
    const {
      name,
      category,
      details,
      price,
      discount,
      description,
      batchSize,
      requirement,
      startDate,
      schedule,
    } = req.body;
    const instructor = req.user
    const liveCourse = await LiveCourse.create({
      name,
      category,
      details,
      price,
      discount,
      description,
      batchSize,
      requirement,
      startDate,
      schedule,
      instructor : instructor._id,
    });
  
    if (liveCourse) {
      res.status(201).json(liveCourse);
    } else {
      res.status(400);
      throw new Error("Unable to create live course");
    }
  });

  const getLiveCoursesByCategory = asyncHandler(async (req, res) => {
    const { category } = req.query;
  
    const liveCourses = await LiveCourse.find({ category }).populate('category liveSections');
    
    if (liveCourses.length) {
      res.status(200).json(liveCourses);
    } else {
      res.status(404);
      throw new Error("No courses found for this category");
    }
  });
  

  const getLiveCourses = asyncHandler(async (req, res) => {
    const liveCourses = await LiveCourse.find({}).populate('category liveSections')
    
    if (liveCourses.length) {
      res.status(200).json(liveCourses);
    } else {
      res.status(404);
      throw new Error("No live courses available");
    }
  });


  const deleteLiveCourse = asyncHandler(async (req, res) => {
    const { id } = req.query;
    const instructor = req.user

    const liveCourse = await LiveCourse.findById(id);
    
    if (!liveCourse) {
      res.status(404);
      throw new Error("Live course not found");
    }
    if(liveCourse.instructor.toString() !== instructor._id.toString()) {
      return res.status(400).send({status: false, message: 'Instructor not authorized to delete this course'})
    }
    if (liveCourse.liveSections.length !== 0) {
      res.status(400).json({ message: "Delete all sections first" });
    } else {
      await LiveCourse.deleteOne({ _id: id });
      res.json({ message: "Live course deleted" });
    }
  });

  const updateLiveCourse = asyncHandler(async (req, res) => {
    const id = req.params.id
    const {
      name,
      category,
      details,
      price,
      discount,
      description,
      batchSize,
      requirement,
      startDate,
      schedule,
      liveSections,
    } = req.body;
    const instructor = req.user
    const liveCourse = await LiveCourse.findById(id);
    
    if (!liveCourse) {
      res.status(404);
      throw new Error("Live course not found");
    }

    if(liveCourse.instructor.toString() !== instructor._id.toString()) {
      return res.status(400).send({status: false, message: 'Instructor not authorized to delete this course'})
    }
    liveCourse.name = name || liveCourse.name;
    liveCourse.category = category || liveCourse.category;
    liveCourse.details = details || liveCourse.details;
    liveCourse.price = price || liveCourse.price;
    liveCourse.discount = discount || liveCourse.discount;
    liveCourse.description = description || liveCourse.description;
    liveCourse.batchSize = batchSize || liveCourse.batchSize;
    liveCourse.requirement = requirement || liveCourse.requirement;
    liveCourse.startDate = startDate || liveCourse.startDate;
    liveCourse.schedule = schedule || liveCourse.schedule;
    liveCourse.liveSections = liveSections || liveCourse.liveSections;
    liveCourse.instructor = instructor._id || liveCourse.instructor
    const updatedLiveCourse = await liveCourse.save();
    res.json(updatedLiveCourse);
  });
  
  module.exports = {
    createLiveCourse,
    getLiveCourses,
    getLiveCoursesByCategory,
    updateLiveCourse,
    deleteLiveCourse,
  };