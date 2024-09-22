const asyncHandler = require("express-async-handler");
const Course = require("../models/coursesModel");
const Section = require("../models/sectionModel");
const { S3Client } = require("@aws-sdk/client-s3");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Plan } = require("../models/planModel");
const Instructor = require("../models/instructorModel");
const { instructor } = require("../middleware/authMiddleware");

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

    await Instructor.findByIdAndUpdate(instructor, {
      $push: { courses: course._id }
    }, {new: true})

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
  })
  .populate('instructor')
  .populate('plan')
  .populate('category');
  if (courses) {
    res.status(201).json(courses);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});

const getAllCoursesOfInstructorForAdmin = asyncHandler(async (req, res) => {
  const { instructor } = req.query;
  
  const pageNumber = parseInt(req.query.pageNumber) || 1
  const pageSize = parseInt(req.query.pageSize) || 1;


  const totalCourses = await Course.countDocuments({ instructor: instructor });
  const pageCount = Math.ceil(totalCourses / pageSize);

  const courses = await Course.find({ instructor: instructor }).populate({
    path: "sections",
    populate: [
      {
        path: "assignment",
      },
    ],
  })
  .skip((pageNumber -1) * pageSize).limit(pageSize)
  .populate('instructor')
  .populate('plan')
  .populate('category');
  if (courses) {
  res.status(200).json({courses, pageCount})
  } else {
    res.status(404);
    throw new Error("Error");
  }
})

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

const getAllCoursesForAdmin = asyncHandler(async (req, res) => {
  const pageNumber = Number(req.query.pageNumber) || 1
  const pageSize = Number(req.query.pageSize) || 2

  const totalCourses = await Course.countDocuments({})
  const pageCount = Math.ceil(totalCourses/pageSize)

  const courses = await Course.find({}).populate({
    path: "sections",
    populate: [
      {
        path: "assignment",
      },
    ],
  })
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize)
  .populate('instructor')
  .populate('plan')
  .populate('category')
  if (courses) {
    res.status(200).json({courses, pageCount});
  } else {
    res.status(404);
    throw new Error("Error");
  }
});

const searchCoursesWithinInstructor = asyncHandler(async (req, res) => {
 
  const query = req.query.Query;
  const instructor = req.query.instructor
  const pageNumber = Number(req.query.pageNumber) || 1;
  const pageSize = Number(req.query.pageSize) || 10

  

  const searchCriteria = {
    instructor: instructor,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { details: { $regex: query, $options: 'i' } }
    ]
  }

  const totalCourses = await Course.countDocuments(searchCriteria)
  const pageCount = Math.ceil(totalCourses/pageSize)

  const courses = await Course.find(searchCriteria)
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize)
  .populate({
    path: "sections",
    populate: [
      {
        path: "assignment",
      },
    ],
  })
  .populate('plan')
  .populate('instructor')
  .populate('category')

  res.status(200).send({ courses, pageCount })
  
})

const searchCourses = asyncHandler(async (req, res) => {
  const query = req.query.Query
  const pageNumber = Number(req.query.pageNumber) || 1
  const pageSize = 20;
 
  const searchCriteria = {
   $or: [ {name: { $regex: query, $options: 'i' }}, {details: { $regex: query, $options: 'i' }}]
  }
  const totalCourses = await Course.countDocuments(searchCriteria)
  const pageCount = Math.ceil(totalCourses/pageSize)
  const courses = await Course.find(searchCriteria)
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize)
  .populate('instructor')
  .populate('plan')
  .populate('category')
  return res.status(200).send({status: true, message: 'Search Successfull', courses,  pageCount})
})

const deleteCourse = asyncHandler(async (req, res) => {
  const subid = req.query.id;
  const instructor = req.query.instructor


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
    await Instructor.findByIdAndUpdate(instructor, {
      $pull: {courses: subid}
    })
    if(sub.plan.length > 0) {
      for(const p of sub.plan) {
        await Plan.findByIdAndUpdate(p, {
          $pull: { courses: subid }
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
      for(const p of newPlans) {
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
  deleteCourse,
  getAllCoursesOfInstructorForAdmin,
  searchCoursesWithinInstructor,
  searchCourses,
  getAllCoursesForAdmin
};
