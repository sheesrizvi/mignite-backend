const asyncHandler = require("express-async-handler");
const { generateTokenUser } = require("../utils/generateToken.js");
const User = require("../models/userModel.js");

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateTokenUser(user._id, user.name, user.email, user.type),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    User registration
// @route   POST /api/users
//@access   Public

const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    aboutme,
    aspiration,
    expectation,
    age,
    education,
    address,
    country,
    gender,
    profile,
    pushToken,
  } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(404);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    aboutme,
    aspiration,
    expectation,
    age,
    education,
    address,
    country,
    gender,
    profile,
    pushToken,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateTokenUser(user._id, user.name, user.email, user.type),
    });
  } else {
    res.status(404);
    throw new Error("Invalid user data");
  }
});

const getUserDetails = asyncHandler(async (req, res) => {
  const userId = req.query.userId
  const user = await User.findById(userId).populate({
                      path: 'purchasedCourses.course',
                      model: 'Course'
                     }).populate({
                       path: 'purchasedCourses.livecourse',
                       model: 'LiveCourse'
                     }).populate('subscriptions')

                     if (!user) {
                      return res.status(404).json({ status: false, message: 'User not found' });
                    }
                    res.status(200).json({status: true, message: 'User Found', user});
})

const getCoursesBoughtByUser = asyncHandler(async (req, res) => {
  const userId = req.query.userId
  const user = await User.findById(userId).populate({
    path: 'purchasedCourses.course',
    model: 'Course'
   }).populate({
     path: 'purchasedCourses.livecourse',
     model: 'LiveCourse'
   }).populate('subscriptions')

   if (!user) {
    return res.status(404).json({ status: false, message: 'User not found' });
  }

  const courses = user.purchasedCourses.filter(item => item.course).map(item => item.course)
  const livecourses = user.purchasedCourses.filter(item => item.livecourse).map(item => item.livecourse)
  
  const allCourses = [...courses, ...livecourses]
  res.status(200).json({status: true, message: 'User Courses Found', courses, livecourses, allCourses});
})



module.exports = {
  authUser,
  registerUser,
  getUserDetails,
  getCoursesBoughtByUser
};
