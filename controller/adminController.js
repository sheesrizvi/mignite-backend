const asyncHandler = require("express-async-handler");
const { generateTokenAdmin } = require("../utils/generateToken.js");
const Admin = require("../models/adminModel.js");
const Instructor = require("../models/instructorModel.js");
const LiveCourse = require("../models/liveCourseModel.js");
const Section = require("../models/sectionModel.js");
const Course = require("../models/coursesModel.js");

// @desc    Auth user & get token
// @route   POST /api/users/login
//  @access   Public

const authAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
 
  if (admin && (await admin.matchPassword(password))) {
    
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      token: generateTokenAdmin(admin._id, admin.name, admin.email, admin.type),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    User registration
// @route   POST /api/users
//@access   Public

const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await Admin.findOne({ email });

  if (userExists) {
    res.status(404);
    throw new Error("User already exists");
  }
  
  const admin = await Admin.create({
    name,
    email,
    password,
   
  });
 
  if (admin) {
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      token: generateTokenAdmin(admin._id, admin.name, admin.email,  admin.type),
    });
  } else {
    res.status(404);
    throw new Error("Invalid user data");
  }
});

const updateInstructorStatus = asyncHandler(async (req, res) => {
  const { status, instructorId } = req.body
  
  const instructor = await Instructor.findById(instructorId)

  if(!instructor) return res.status(400).send({message: "Instructor not found"})

  const validStatus = ['approved', 'pending', 'rejected']
  if(!validStatus.includes(status)) return res.status(400).send({message: 'Invalid status'})

  // if(status === 'pending') {
  //   instructor.status = status
  // } else {
  //   instructor.status = status
  //   instructor.active = true
  //   // instructor.rejectedAt = Date.now()
  // }
  
  if (status === 'pending') {
    instructor.status = status;
  } else if (status === 'approved') {
      instructor.status = status;
      instructor.active = true;
  } else if (status === 'rejected') {
      instructor.status = status;
      instructor.rejectedAt = Date.now();
      instructor.active = false;
  }

  await instructor.save()
  return res.status(200).send({message: `Instructor got ${status}`, instructor})

})

const updateCourseStatus = asyncHandler(async (req, res) => {
  const { status, courseId } = req.body

  const course = await Course.findById(courseId)
  if(!course) return res.status(400).send({message: "Course not found"})

  const validStatus = ['approved', 'pending', 'rejected']
  if(!validStatus.includes(status)) return res.status(400).send({message: 'Invalid status'})
 
  course.status = status
  await course.save()
  return res.status(200).send({message: `Course got ${status}`, course})

})



const updateLiveCourseStatus = asyncHandler(async (req, res) => {
  const { status, liveCourseId } = req.body
  console.log(req.body)
  const liveCourse = await LiveCourse.findById(liveCourseId)
  if(!liveCourse) return res.status(400).send({message: "LiveCourse not found"})

  const validStatus = ['approved', 'pending', 'rejected']
  if(!validStatus.includes(status)) return res.status(400).send({message: 'Invalid status'})

  liveCourse.status = status
  
  await liveCourse.save()
  return res.status(200).send({message: `LiveCourse got ${status}`, liveCourse})

})

const updateSectionController = asyncHandler(async (req, res) => {
  const { status, sectionId } = req.body

  const section = await Section.findById(sectionId)
  if(!section) return res.status(400).send({message: "Section not found"})

  const validStatus = ['approved', 'pending', 'rejected']
  if(!validStatus.includes(status)) return res.status(400).send({message: 'Invalid status'})

  section.status = status
  await section.save()
  return res.status(200).send({message: `Section got ${status}`, section})

})

// only for testing purpose
const updateAllModuleStatus = asyncHandler(async (req, res) => {
 
  await Instructor.updateMany({}, {
    status: 'approved'
  })

  await Course.updateMany({}, {
    status: 'approved'
  })
  
  await LiveCourse.updateMany({}, {
    status: 'approved'
  })
  

  res.status(200).send({message: 'Course, Instructor, LiveCourse updated successfully'})
})

module.exports = {
  authAdmin,
  registerAdmin,
  updateInstructorStatus,
  updateCourseStatus,
  updateLiveCourseStatus,
  updateSectionController,
  updateAllModuleStatus
};
