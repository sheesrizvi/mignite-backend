const asyncHandler = require("express-async-handler");
const { generateTokenUser } = require("../utils/generateToken.js");
const User = require("../models/userModel.js");
const mongoose = require("mongoose");
const { Subscription } = require("../models/subscriptionModel.js");
const { sendResetEmail, sendVerificationEmail } = require("../middleware/handleEmail.js");
const generator = require('generate-password')
const UserProgress = require("../models/userProgressModel");
const Course = require("../models/coursesModel");

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
 
  if (user && (await user.matchPassword(password))) {
    if(!user || user.isDeleted) {
      return res.status(400).send({ message: 'User not found' })
    }

    let otp = generator.generate({
      length: 10,
      numbers: true
    })
  
    if(!user.active) {
      sendVerificationEmail(user.otp, user.email)
      user.otp = otp
      await user.save()
      return res.status(400).send({ message: 'OTP Sent. Please verified profile first for login', active: false })
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      active: true,
      token: generateTokenUser(user._id, user.name, user.email, user.age, user.type),
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
 
  if (userExists && !userExists.isDeleted) {
    res.status(404);
    throw new Error("User already exists");
  }

  let otp = generator.generate({
    length: 10,
    numbers: true
  })

 if(userExists && userExists.isDeleted) {
    userExists.name = name || userExists.name
    userExists.password = password 
    userExists.age = age
    userExists.phone = phone
    userExists.aboutme = aboutme
    userExists.aspiration = aspiration
    userExists.education = education
    userExists.address = address
    userExists.country = country
    userExists.gender = gender
    userExists.profile = profile
    userExists.pushToken = pushToken
    userExists.otp = otp

    await userExists.save()

    return res.status(200).send({
      _id: user._id,
      name: user.name,
      email: user.email,
      // token: generateTokenUser(user._id, user.name, user.email, user.age, user.type),
      message: 'Verification OTP sent to your email. Please verify your email for login'
    })
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
    otp
  });
  
  if (user) {
  
    sendVerificationEmail(user.otp, user.email)
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      // token: generateTokenUser(user._id, user.name, user.email, user.age, user.type),
      message: 'Verification OTP sent to your email. Please verify your email for login'
    });
  } else {
    res.status(404);
    throw new Error("Invalid user data");
  }
});


const updateUserProfile = asyncHandler(async (req, res) => {
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

  const userId = req.user._id;

  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const userExists = await User.findOne({ email, _id: { $ne: userId } });

  if (userExists) {
    res.status(400);
    throw new Error("Email already in use");
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.password = password || user.password
  user.phone = phone || user.phone;
  user.aboutme = aboutme || user.aboutme;
  user.aspiration = aspiration || user.aspiration;
  user.expectation = expectation || user.expectation;
  user.age = age || user.age;
  user.education = education || user.education;
  user.address = address || user.address;
  user.country = country || user.country;
  user.gender = gender || user.gender;
  user.profile = profile || user.profile;
  user.pushToken = pushToken || user.pushToken;

  const updatedUser = await user.save();

  res.status(200).json({
    user: updatedUser,
    token: generateTokenUser(updatedUser._id, updatedUser.name, updatedUser.email, updatedUser.age, updatedUser.type),
  });
});


const getUserDetails = asyncHandler(async (req, res) => {
  const userId = req.query.userId
  const user = await User.findById(userId).populate({
                      path: 'purchasedCourses.course',
                      model: 'Course'
                     }).populate({
                       path: 'purchasedCourses.livecourse',
                       model: 'LiveCourse'
                     })

                     if (!user) {
                      return res.status(404).json({ status: false, message: 'User not found' });
                    }
                    res.status(200).json({status: true, message: 'User Found', user});
})


const getCoursesBoughtByUser = asyncHandler(async (req, res) => {
  const userId = req.query.userId;
  
  const user = await User.findById(userId)
    .populate({
      path: 'purchasedCourses.course',
      model: 'Course',
      populate: [
        { 
          path: 'instructor', 
          model: 'Instructor' 
        },
        { 
          path: 'sections', 
          model: 'Section', 
          populate: {
            path: 'assignment',
            model: 'Assignment'
          }
        }  ,
        { 
          path: 'reviews', 
          model: 'Review', 
          populate: {
            path: 'user',
            model: 'User'
          }
        }     
      ]
    })
    .populate({
      path: 'purchasedCourses.livecourse',
      model: 'LiveCourse',
      populate: [
        { 
          path: 'instructor', 
          model: 'Instructor' 
        },
        { 
          path: 'liveSections', 
          model: 'LiveSection', 
          populate: {
            path: 'assignment',
            model: 'Assignment'
          }
        },  { 
          path: 'reviews', 
          model: 'Review',
          populate: {
            path: 'user',
            model: 'User'
          }
        }     
      ]
    });

  if (!user) {
    return res.status(404).json({ status: false, message: 'User not found' });
  }

  let courses = user.purchasedCourses.filter(item => item.course).map(item => item.course);
  const livecourses = user.purchasedCourses.filter(item => item.livecourse).map(item => item.livecourse);

  let progressReport = []
  for (let courseItem of courses) {
    const courseId = courseItem._id

    const userProgress = await UserProgress.findOne({ user: userId, course: courseId })
    const course = await Course.findOne({ _id: courseId }).select('sections')
   
    if (course.sections.length === 0) {

       progressReport.push(
        {
          course: courseItem._id,
          userProgress: 0, 
          courseCompletePercentage:0, 
          viewedSectionCount:0, 
          totalSectionsCount:0
        }
    )
      
    }
  
    const courseCompletePercentage = userProgress.courseCompletePercentage
  
    const viewedSectionCount = userProgress.viewedSections?.length > 0 ? userProgress.viewedSections.length : 0
    const totalSectionsCount = course.sections.length || 0
  
   progressReport.push({
      course: courseItem._id,
      userProgress, 
      courseCompletePercentage, 
      viewedSectionCount, 
      totalSectionsCount
    })
  }
 let updatedCourse = []
  for (let report of progressReport) {
    let result = courses.find((course) => course._id === report.course)
    updatedCourse.push({...result.toObject(), report})
  }
  const allCourses = [...updatedCourse, ...livecourses];

  

  res.status(200).json({ 
    status: true, 
    message: 'User Courses Found', 
    courses: updatedCourse, 
    livecourses, 
    allCourses,
  });
});


const getSubscriptionByUser = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const subscriptions = await Subscription.find({ user: userId })
    .populate('user')
    .populate('plan');

  res.status(200).json({status: true, subscriptions});
});

const resetPassword = asyncHandler(async(req, res) => {
  const {  email } = req.body
  if(!email) {
      return res.status(400).send({status:true, message: 'Email not Found'})
  }
  const existedUser = await User.findOne({email})
  if(!existedUser) {
      return res.status(400).send({status: false, message: 'Email not exist'})
  }
  
  const randomPassword = await sendResetEmail(existedUser.email)
  console.log(randomPassword)
  existedUser.password = randomPassword
  await existedUser.save()
  res.status(200).send({status: true, message: 'OTP sent to your email. Please check for passwrod reset'})
})

const verifyUserProfile = asyncHandler(async (req, res) => {
  const { email, otp } = req.body

  const user = await User.findOne({ email })
  if(!user) return res.status(400).send({message: 'User not found'})

  if(user.otp !== otp) return res.status(400).send({ message: 'OTP not valid' })
  user.active = true
  user.otp = ""
  await user.save()

  res.status(200).send({ message: 'User verified successfully', user, token: generateTokenUser(user._id, user.name, user.email, user.age, user.type) })
})

const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.query

  const user = await User.findOneAndUpdate({ _id: userId }, { active: false, isDeleted: true })
  
  if(!user) {
    return res.status(400).send({ message: 'User not found' })
  }

  res.status(200).send({ message: 'User deleted successfully' })
  
})

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({})
    res.send({ users })
})

module.exports = {
  authUser,
  registerUser,
  getUserDetails,
  getCoursesBoughtByUser,
  getSubscriptionByUser,
  updateUserProfile,
  resetPassword,
  verifyUserProfile,
  deleteUser,
  getAllUsers
};
