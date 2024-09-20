const asyncHandler = require("express-async-handler");
const Course = require("../models/coursesModel");
const Section = require("../models/sectionModel");
const { S3Client } = require("@aws-sdk/client-s3");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Plan } = require("../models/planModel");

const config = {
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
};

const s3 = new S3Client(config);

const createCourse = asyncHandler(async (req, res) => {
  let {
    name,
    category,
    instructor,
    image,
    details,
    description,
    price,
    requirement,
    plan
  } = req.body;


  if(plan) {
    plan = Array.isArray(plan) ? plan : [plan];
  }


  const course = await Course.create({
    name,
    category,
    instructor,
    image,
    details,
    description,
    price,
    requirement,
    plan
  });
  if (course) {
    if(plan) {
      
      for(const p of plan) {
      
        await Plan.findByIdAndUpdate(p, {
          $push: { courses: course._id }
        }, { new: true })
      }
    }

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
  }).populate('instructor')
  .populate('plan');
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
  }).populate('instructor')
  .populate('plan');
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
  }).populate('instructor')
  .populate('plan');
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

    res.status(404).json("Delete all sections of this course first")

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
    if(sub.plan.length > 0) {
      for(const p of sub.plan) {
        await Plan.findByIdAndUpdate(p, {
          $pull: { courses: sub._id }
        })
      }
    }
    res.status(200).json("deleted");
  }

});

const updateCourse = asyncHandler(async (req, res) => {

  let {
    id,
    name,
    category,
    instructor,
    image,
    details,
    description,
    price,
    requirement,
    plan
  } = req.body;

  const course = await Course.findById(id);
 
  if (course) {
    course.name = name || course.name;
    course.price = price || course.price;
    course.requirement = requirement || course.requirement;
    course.details = details || course.details;
    course.description = description || course.description;
    course.instructor = instructor || course.instructor;
    course.category = category || course.category;
    course.image = image ? image : course.image;
    let newPlans
    if(plan) {
      newPlans = Array.isArray(plan) ? plan : [plan];
      if (course.plan) {
        course.plan = [... new Set([...course.plan, ...newPlans])]
      } else {
       course.plan = newPlans
      }
        
     }
    const updatedCourse = await course.save();

    if(newPlans) {
      for(const p of plan) {
        await Plan.findByIdAndUpdate(p, {
          $addToSet: { courses: course._id }
        }, { new: true })
      }
    }
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
