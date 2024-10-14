const asyncHandler = require("express-async-handler");
const { generateTokenInstructor } = require("../utils/generateToken.js");
const Instructor = require("../models/instructorModel.js");
const { createMeeting } = require("../middleware/meetingLinkGenerate.js");
const LiveSection = require("../models/liveSectionModel.js");
const LiveCourse = require("../models/liveCourseModel.js");
const Course = require("../models/coursesModel.js");
const mongoose = require('mongoose')
// @desc    Auth user & get token
// @route   POST /api/users/login
//  @access   Public

const authInstructor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const instructor = await Instructor.findOne({ email });

  if (instructor && (await instructor.matchPassword(password))) {
    if(instructor.status === 'pending' || instructor.status === 'rejected') {
      return res.status(400).send({message: 'Instructor status not approved yet. Please wait till admin approval'})
    }

    res.json({
      _id: instructor._id,
      name: instructor.name,
      email: instructor.email,
      token: generateTokenInstructor(instructor._id, instructor.name, instructor.email, instructor.type ),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

// @desc    User registration
// @route   POST /api/users
//@access   Public

const registerInstructor = asyncHandler(async (req, res) => {
  const { name, email, password, description, phone } = req.body;

  const userExists = await Instructor.findOne({ email });

  if (userExists) {
    res.status(404);
    throw new Error("Instructor already exists");
  }

  const instructor = await Instructor.create({
    name,
    email,
    password,
    phone,
    description,
    
  });

  if (instructor) {
    res.json({
        _id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        //token: generateTokenInstructor(instructor._id, instructor.name, instructor.email, instructor.type),
        message:'Instructor created succesfully, Please wait till admin approval'
      });
  } else {
    res.status(404);
    throw new Error("Invalid instructor data");
  }
});


const updateInstructor = asyncHandler(async (req, res) => {
  const { instructorId, name, email, description, phone } = req.body;

  const instructor = await Instructor.findById(instructorId);

  if (!instructor) {
    return res.status(404).send({ status: false, message: 'Instructor not found' });
  }

  if (email && email !== instructor.email) {
    const userExists = await Instructor.findOne({ email });
    if (userExists) {
      return res.status(400).send({ status: false, message: 'Email already exists' });
    }
  }

  instructor.name = name || instructor.name;
  instructor.email = email || instructor.email;
  instructor.description = description || instructor.description;
  instructor.phone = phone || instructor.phone;
  instructor.active = active || instructor.active
  const updatedInstructor = await instructor.save();

  if (updatedInstructor) {
    res.status(200).json({
      _id: updatedInstructor._id,
      name: updatedInstructor.name,
      email: updatedInstructor.email,
      token: generateTokenInstructor(updatedInstructor._id, updatedInstructor.name, updatedInstructor.email, updatedInstructor.type),
    });
  } else {
    res.status(500).send({ status: false, message: 'Error updating instructor' });
  }
});


const getAllInstructor = asyncHandler(async (req, res) => {
  const pageNumber = parseInt(req.query.pageNumber) || 1
  const pageSize = parseInt(req.query.pageSize) || 20;


  const totalInstructors = await Instructor.countDocuments({status: 'approved'});
  const pageCount = Math.ceil(totalInstructors / pageSize);

  if (!req.query.pageNumber) {
    const instructors = await Instructor.find({status: 'approved'});
    return res.status(200).json({
      status: true,
      message: 'All Instructors List',
      instructors,
      pageCount,
    });
  }

  const instructors = await Instructor.find({status: 'approved'}).skip((pageNumber -1) * pageSize).limit(pageSize)
  if(instructors.length === 0) {
    return res.status(400).send({success: false, message: 'Instructor Not Found'})
  }

  res.status(200).send({status: true, message: 'Instructor List', instructors, pageCount})
})

const fetchInstructorBySearch = asyncHandler(async (req, res) => {
 const query = req.query.Query
 const pageNumber = Number(req.query.pageNumber) || 1
 const pageSize = 20;

 const searchCriteria = {
  status: 'approved',
  $or: [ {name: { $regex: query, $options: 'i' }}, {email: { $regex: query, $options: 'i' }}]
 }
 const totalInstructors = await Instructor.countDocuments(searchCriteria)
 const pageCount = Math.ceil(totalInstructors/pageSize)
 const instructors = await Instructor.find(searchCriteria).skip((pageNumber - 1) * pageSize).limit(pageSize)

 return res.status(200).send({status: true, message: 'Search Successfull', instructors,  pageCount})
})

const getPendingInstructor = asyncHandler(async (req, res) => {
  const pageNumber = parseInt(req.query.pageNumber) || 1
  const pageSize = parseInt(req.query.pageSize) || 20;

  const statusArr = ['pending', 'rejected']
  const totalInstructors = await Instructor.countDocuments({status: 'pending'});
  const pageCount = Math.ceil(totalInstructors / pageSize);

  if (!req.query.pageNumber) {
    const instructors = await Instructor.find({status: 'pending'});
    return res.status(200).json({
      status: true,
      message: 'All Pending Instructors List',
      instructors,
      pageCount,
    });
  }

  const instructors = await Instructor.find({status: 'pending'}).skip((pageNumber -1) * pageSize).limit(pageSize)
  if(instructors.length === 0) {
    return res.status(400).send({success: false, message: 'Instructor Not Found'})
  }
  

  res.status(200).send({status: true, message: 'Instructor List', instructors, pageCount})
})

const deleteInstructor = asyncHandler(async (req, res) => {
  
  const id = req.query.id
  const instructor = await Instructor.findById(id)
  if(instructor.courses.length > 0) {
    return res.status(400).send({success: false, message: "Delete courses first"})
  }
  await Instructor.findByIdAndDelete(id)
  res.status(200).send({status: true, message: 'Instructor Deleted successfully'})
})


module.exports = {
  authInstructor,
  registerInstructor,
  getAllInstructor,
  fetchInstructorBySearch,
  deleteInstructor,
  updateInstructor,
  getPendingInstructor
};
