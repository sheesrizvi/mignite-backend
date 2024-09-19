const asyncHandler = require("express-async-handler");
const LiveCourse = require("../models/liveCourseModel");
const { instructor } = require("../middleware/authMiddleware");
const Category = require("../models/category");
const { Plan } = require("../models/planModel");

const createLiveCourse = asyncHandler(async (req, res) => {
 
  let {
    name,
    category,
    details,
    price,
    discount,
    description,
    batchSize,
    requirement,
    startDate,
    endDate, image,
    instructor,
    plan
  } = req.body;

  if(plan) {
    plan = Array.isArray(plan) ? plan : [plan];
  }


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
    endDate,
    instructor,
    image,
    plan
  });

  if (liveCourse) {

    if(plan) {
      for(const p of plan) {
        await Plan.findByIdAndUpdate(p, {
          $push : { courses: liveCourse._id }
        }, { new: true })
      }
    }

    res.status(201).json(liveCourse);
  } else {
    res.status(400);
    throw new Error("Unable to create live course");
  }
});

const getLiveCoursesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const liveCourses = await LiveCourse.find({ category }).populate('category liveSections plan');

  if (liveCourses.length) {
    res.status(200).json(liveCourses);
  } else {
    res.status(404);
    throw new Error("No courses found for this category");
  }
});


const getLiveCourses = asyncHandler(async (req, res) => {
  const liveCourses = await LiveCourse.find({}).populate('category liveSections plan')

  if (liveCourses.length) {
    res.status(200).json(liveCourses);
  } else {
    res.status(404);
    throw new Error("No live courses available");
  }
});


const deleteLiveCourse = asyncHandler(async (req, res) => {
  const { id } = req.query;
  const {instructor} = req.body

  const liveCourse = await LiveCourse.findById(id);

  if (!liveCourse) {
    res.status(404);
    throw new Error("Live course not found");
  }


  if (liveCourse.instructor.toString() !== instructor?.toString()) {
    return res.status(400).send({ status: false, message: 'Instructor not authorized to delete this course' })
  }
  if (liveCourse.liveSections.length !== 0) {
    res.status(400).json({ message: "Delete all sections first" });
  } else {
    await LiveCourse.deleteOne({ _id: id });
    if(liveCourse.plan.length > 0) {
      for(const p of liveCourse.plan) {
        await Plan.findByIdAndUpdate(p, {
          $pull: { courses: liveCourse._id }
        })
      }
    }
    res.json({ message: "Live course deleted" });
  }
});

const deleteAllLiveCourses = asyncHandler(async (req, res) => {
  const result = await LiveCourse.deleteMany({})
  res.status(200).send(result)
})

const updateLiveCourse = asyncHandler(async (req, res) => {
  const id = req.params.id
  let {
    name,
    category,
    details,
    price,
    discount,
    description,
    batchSize,
    requirement,
    startDate,
    endDate,
    liveSections,
    instructor,
    plan
  } = req.body;
  
  const liveCourse = await LiveCourse.findById(id);

  if (!liveCourse) {
    res.status(404);
    throw new Error("Live course not found");
  }
  
  if (liveCourse.instructor.toString() !== instructor?.toString()) {
    return res.status(400).send({ status: false, message: 'Instructor not authorized to update this course' })
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
  liveCourse.endDate = endDate || liveCourse.endDate;
  liveCourse.liveSections = liveSections || liveCourse.liveSections;
  liveCourse.instructor = instructor || liveCourse.instructor
  let newPlans
  if(plan) {
    newPlans = Array.isArray(plan) ? plan : [plan];
    if (liveCourse.plan) {
      liveCourse.plan = [...new Set([...liveCourse.plan, ...newPlans])];
    } else {
     liveCourse.plan = newPlans
    }
   }
   
  const updatedLiveCourse = await liveCourse.save();
  if(newPlans) {
    for(const p of newPlans) {
      await Plan.findByIdAndUpdate(p, {
        $addToSet: { courses: liveCourse._id }
      })
    }
  }
  

  res.json(updatedLiveCourse);
});

const getLiveCoursesByInstructor = asyncHandler(async (req, res) => {
  const {instructor} = req.query
  const courses = await LiveCourse.find({instructor})
  if(courses.length === 0) {
    return res.status(400).send({status: true, message: "Courses not exist"})
  }

  res.status(200).send(courses)
})

module.exports = {
  createLiveCourse,
  getLiveCourses,
  getLiveCoursesByCategory,
  updateLiveCourse,
  deleteLiveCourse,
  getLiveCoursesByInstructor,
  deleteAllLiveCourses
};
