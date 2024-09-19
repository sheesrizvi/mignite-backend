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
    res.json({
      _id: instructor._id,
      name: instructor.name,
      email: instructor.email,
      token: generateTokenInstructor(instructor._id, instructor.name, instructor.email, instructor.type),
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
    throw new Error("User already exists");
  }

  const instructor = await Instructor.create({
    name,
    email,
    password,
    phone,
    description
  });

  if (instructor) {
    res.json({
        _id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        token: generateTokenInstructor(instructor._id, instructor.name, instructor.email, instructor.type),
      });
  } else {
    res.status(404);
    throw new Error("Invalid user data");
  }
});



module.exports = {
  authInstructor,
  registerInstructor,
};
