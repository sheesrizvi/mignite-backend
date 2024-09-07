const asyncHandler = require("express-async-handler");
const { generateTokenInstructor } = require("../utils/generateToken.js");
const Instructor = require("../models/instructorModel.js");
const { createMeeting } = require("../middleware/meetingLinkGenerate.js");
const LiveSection = require("../models/liveSectionModel.js");
const LiveCourse = require("../models/liveCourseModel.js");
const Course = require("../models/coursesModel.js");


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

// @desc    Instruction Course Section Link Generation
// @route   POST /api/instructor/createmeeting/:courseId
//@access   Protected

const courseMeetingLinkGenerate = asyncHandler(async (req, res) => {
  try{
    const now = new Date();
    const courseId  = req.params.courseId
    const instructor = req.user
    let {srNumber, name, type, time} = req.body
    
    if(!time) {
      time = new Date(now.getTime() + 1 * 60 * 1000) // Adding for now will remove later just for testing time part 
    }
    const { callId , meetingData} = await createMeeting(instructor._id, time)
    
    const checkCouseExist = await LiveCourse.findById(courseId) 
    
    if(!checkCouseExist){
      return res.status(404).send({status: false, message: 'No Such Courses Exist'})
  
    }
    let newLiveSection = new LiveSection({
      liveCourse: courseId,
      srNumber,
      name,
      type,
      link: callId,
      time
    })
    newLiveSection =await newLiveSection.save()

    // await LiveCourse.findByIdAndUpdate(courseId, { $push: { liveSections: newLiveSection._id} })
    return res.status(200).send({status: true, newLiveSection})
  }
 

  catch(e) {
    return res.status(400).send({message: e, status: false})
  }
})

module.exports = {
  authInstructor,
  registerInstructor,
  courseMeetingLinkGenerate
};
