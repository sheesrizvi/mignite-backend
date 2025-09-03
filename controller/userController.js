const asyncHandler = require("express-async-handler");
const { generateTokenUser } = require("../utils/generateToken.js");
const User = require("../models/userModel.js");
const mongoose = require("mongoose");
const { Subscription } = require("../models/subscriptionModel.js");
const { sendResetEmail, sendVerificationEmail } = require("../middleware/handleEmail.js");
const generator = require('generate-password')
const UserProgress = require("../models/userProgressModel");
const Course = require("../models/coursesModel");
const LiveCourse = require("../models/liveCourseModel");
const { Plan } = require('../models/planModel')


const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
 
  if (user && (await user.matchPassword(password))) {
    if(!user || user.isDeleted) {
      return res.status(400).send({
        message: {
          en: "User not found",
          ar: "المستخدم غير موجود"
        }
      })

    }

   
    let otp = Math.floor(1000000000 + Math.random() * 9000000000);
    console.log(otp);
    
    if(!user.active) {
      sendVerificationEmail(otp, user.email)
      user.otp = otp
      await user.save()
     return res.status(400).send({
        message: {
          en: "OTP sent. Please verify profile first for login",
          ar: "تم إرسال رمز التحقق. يرجى التحقق من الملف الشخصي أولاً لتسجيل الدخول"
        },
        active: false
      })
    }

    res.json({
       message: {
        en: "Login Success",
        ar: "تم تسجيل الدخول بنجاح"
      },
      _id: user._id,
      name: user.name,
      email: user.email,
      active: true,
      token: generateTokenUser(user._id, user.name, user.email, user.age, user.type),
    });
  } else {
   return res.status(400).send({
      message: {
        en: "Invalid email or password",
        ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة"
      }
    })

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
   return res.status(404).send({
      message: {
        en: "User already exists",
        ar: "المستخدم موجود بالفعل"
      }
    })

  }

  let otp = Math.floor(1000000000 + Math.random() * 9000000000);
  console.log(otp);
  

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
       message: {
        en: "Verification OTP sent to your email. Please verify your email for login",
        ar: "تم إرسال رمز التحقق إلى بريدك الإلكتروني. يرجى التحقق من بريدك الإلكتروني لتسجيل الدخول"
      }
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
      message: {
        en: "Verification OTP sent to your email. Please verify your email for login",
        ar: "تم إرسال رمز التحقق إلى بريدك الإلكتروني. يرجى التحقق من بريدك الإلكتروني لتسجيل الدخول"
      }
    });
  } else {
    return res.status(404).send({
      message: {
        en: "Invalid user data",
        ar: "بيانات المستخدم غير صالحة"
      }
    })

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
   return res.status(404).send({
      message: {
        en: "User not found",
        ar: "المستخدم غير موجود"
      }
    })

  }

  const userExists = await User.findOne({ email, _id: { $ne: userId } });

  if (userExists) {
    return res.status(400).send({
      message: {
        en: "Email already in use",
        ar: "البريد الإلكتروني مستخدم بالفعل"
      }
    })

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
   message: {
        en: "User profile Updated",
        ar: "تم تحديث ملف المستخدم"
    },
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
                      return res.status(404).json({
                          status: false,
                          message: {
                            en: "User not found",
                            ar: "المستخدم غير موجود"
                          }
                        })
                    }

                    res.status(200).json({
                      status: true,
                      message: {
                        en: "User found",
                        ar: "تم العثور على المستخدم"
                      },
                      user
                    })

})


// const getCoursesBoughtByUser = asyncHandler(async (req, res) => {
//   const userId = req.query.userId;
  
//   const user = await User.findById(userId)
//     .populate({
//       path: 'purchasedCourses.course',
//       model: 'Course',
//       populate: [
//         { 
//           path: 'instructor', 
//           model: 'Instructor' 
//         },
//         { 
//           path: 'sections', 
//           model: 'Section', 
//           populate: {
//             path: 'assignment',
//             model: 'Assignment'
//           }
//         }  ,
//         { 
//           path: 'reviews', 
//           model: 'Review', 
//           populate: {
//             path: 'user',
//             model: 'User'
//           }
//         }     
//       ]
//     })
//     .populate({
//       path: 'purchasedCourses.livecourse',
//       model: 'LiveCourse',
//       populate: [
//         { 
//           path: 'instructor', 
//           model: 'Instructor' 
//         },
//         { 
//           path: 'liveSections', 
//           model: 'LiveSection', 
//           populate: {
//             path: 'assignment',
//             model: 'Assignment'
//           }
//         },  { 
//           path: 'reviews', 
//           model: 'Review',
//           populate: {
//             path: 'user',
//             model: 'User'
//           }
//         }     
//       ]
//     });

//   const userExist = await User.findById(userId)
//   console.log(userExist)
//   if (!user) {
//     return res.status(404).json({ status: false, message: 'User not found' });
//   }

//   let courses = user.purchasedCourses.filter(item => item.course).map(item => item.course);
//   const livecourses = user.purchasedCourses.filter(item => item.livecourse).map(item => item.livecourse);
 
//   let progressReport = []
//   for (let courseItem of courses) {
//     const courseId = courseItem._id

//     const userProgress = await UserProgress.findOne({ user: userId, course: courseId })
//     const course = await Course.findOne({ _id: courseId }).select('sections')
   
//     if (course.sections.length === 0) {

//        progressReport.push(
//         {
//           course: courseItem._id,
//           userProgress: 0, 
//           courseCompletePercentage:0, 
//           viewedSectionCount:0, 
//           totalSectionsCount:0
//         }
//     )
      
//     }
  
//     const courseCompletePercentage = userProgress.courseCompletePercentage
  
//     const viewedSectionCount = userProgress.viewedSections?.length > 0 ? userProgress.viewedSections.length : 0
//     const totalSectionsCount = course.sections.length || 0
  
//    progressReport.push({
//       course: courseItem._id,
//       userProgress, 
//       courseCompletePercentage, 
//       viewedSectionCount, 
//       totalSectionsCount
//     })
//   }
//  let updatedCourse = []
//   for (let report of progressReport) {
//     let result = courses.find((course) => course._id === report.course)
//     updatedCourse.push({...result.toObject(), report})
//   }
//   const allCourses = [...updatedCourse, ...livecourses];

  

//   res.status(200).json({ 
//     status: true, 
//     message: 'User Courses Found', 
//     courses: updatedCourse, 
//     livecourses, 
//     allCourses,
//   });
// });

const getCoursesBoughtByUser = asyncHandler(async (req, res) => {
  const userId = req.query.userId;

  const user = await User.findById(userId)
    .populate({
      path: 'purchasedCourses.course',
      model: 'Course',
      populate: [
        { path: 'instructor', model: 'Instructor' },
        {
          path: 'sections',
          model: 'Section',
          populate: { path: 'assignment', model: 'Assignment' },
        },
        {
          path: 'reviews',
          model: 'Review',
          populate: { path: 'user', model: 'User' },
        },
      ],
    })
    .populate({
      path: 'purchasedCourses.livecourse',
      model: 'LiveCourse',
      populate: [
        { path: 'instructor', model: 'Instructor' },
        {
          path: 'liveSections',
          model: 'LiveSection',
          populate: { path: 'assignment', model: 'Assignment' },
        },
        {
          path: 'reviews',
          model: 'Review',
          populate: { path: 'user', model: 'User' },
        },
      ],
    });

  if (!user) {
    return res.status(404).json({
      status: false,
      message: {
        en: "User not found",
        ar: "المستخدم غير موجود"
      }
    })
  }

  let purchasedCourses = user.purchasedCourses.filter(item => item.course).map(item => item.course);
  const livecourses = user.purchasedCourses.filter(item => item.livecourse).map(item => item.livecourse);

  let progressReport = [];

  for (let courseItem of purchasedCourses) {
    const courseId = courseItem._id;
    const userProgress = await UserProgress.findOne({ user: userId, course: courseId });
    const course = await Course.findOne({ _id: courseId }).select('sections');

    if (!userProgress || !course || course.sections.length === 0) {
      progressReport.push({
        course: courseId,
        userProgress: 0,
        courseCompletePercentage: 0,
        viewedSectionCount: 0,
        totalSectionsCount: course?.sections?.length || 0,
      });
      continue;
    }

    progressReport.push({
      course: courseId,
      userProgress,
      courseCompletePercentage: userProgress.courseCompletePercentage,
      viewedSectionCount: userProgress.viewedSections?.length || 0,
      totalSectionsCount: course.sections.length,
    });
  }

  let updatedPurchasedCourses = [];
  for (let report of progressReport) {
    let result = purchasedCourses.find((course) => course._id.equals(report.course));
    updatedPurchasedCourses.push({ ...result.toObject(), report });
  }

  const subscription = await Subscription.findOne({ user: userId, status: 'active' }).populate('plan');

  let subscribedCourses = [];
  let subscribedLiveCourses = [];

  if (subscription) {
    const subscriptionLevel = subscription.plan.level;
    const plans = await Plan.find({ level: { $gte: subscriptionLevel } })
      .populate('courses')
      .populate('liveCourses');

    const courseSet = new Set();
    const liveCourseSet = new Set();

    for (const plan of plans) {
      plan.courses.forEach(course => courseSet.add(course._id.toString()));
      plan.liveCourses.forEach(liveCourse => liveCourseSet.add(liveCourse._id.toString()));
    }

    const purchasedCourseIds = new Set(purchasedCourses.map(course => course._id.toString()));
    const subscribedCourseIds = Array.from(courseSet).filter(id => !purchasedCourseIds.has(id));

    const allSubscribedCourses = await Course.find({ _id: { $in: subscribedCourseIds } })
      .populate('instructor')
      .populate({ path: 'sections', populate: { path: 'assignment' } })
      .populate({ path: 'reviews', populate: { path: 'user' } });

    for (let course of allSubscribedCourses) {
      const userProgress = await UserProgress.findOne({ user: userId, course: course._id });
      const courseData = await Course.findOne({ _id: course._id }).select('sections');
      const totalSectionsCount = courseData?.sections?.length || 0;

      let report = {
        course: course._id,
        userProgress: userProgress || 0,
        courseCompletePercentage: userProgress?.courseCompletePercentage || 0,
        viewedSectionCount: userProgress?.viewedSections?.length || 0,
        totalSectionsCount,
      };

      subscribedCourses.push({ ...course.toObject(), report });
    }

    const purchasedLiveCourseIds = new Set(livecourses.map(lc => lc._id.toString()));
    const subscribedLiveCourseIds = Array.from(liveCourseSet).filter(id => !purchasedLiveCourseIds.has(id));

    subscribedLiveCourses = await LiveCourse.find({ _id: { $in: subscribedLiveCourseIds } })
      .populate('instructor')
      .populate({ path: 'liveSections', populate: { path: 'assignment' } })
      .populate({ path: 'reviews', populate: { path: 'user' } });
  }

  const allCourses = [...updatedPurchasedCourses, ...livecourses, ...subscribedCourses, ...subscribedLiveCourses];

  res.status(200).json({
   status: true,
   message: {
      en: "User courses found",
      ar: "تم العثور على دورات المستخدم"
    },
    courses: updatedPurchasedCourses,
    livecourses,
    subscribedCourses,
    subscribedLiveCourses,
    allCourses,
  });
});


const getSubscriptionByUser = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const subscriptions = await Subscription.find({ user: userId, status: "active" })
    .populate('user')
    .populate('plan');

  res.status(200).json({ 
    message: { en: 'Subscriptions found', ar: 'تم العثور على الاشتراكات' }, 
    status: true,
    subscriptions});
});

// const resetPassword = asyncHandler(async(req, res) => {
//   const {  email } = req.body
//   if(!email) {
//       return res.status(400).send({status:true, message: 'Email not Found'})
//   }
//   const existedUser = await User.findOne({email})
//   if(!existedUser) {
//       return res.status(400).send({status: false, message: 'Email not exist'})
//   }
  
//   const randomPassword = await sendResetEmail(existedUser.email)
//   console.log(randomPassword)
//   existedUser.password = randomPassword
//   await existedUser.save()
//   res.status(200).send({status: true, message: 'OTP sent to your email. Please check for passwrod reset'})
// })

const resetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).send({
      status: false,
      message: {
        en: 'Email not Found',
        ar: 'البريد الإلكتروني غير موجود'
      }
    });
  }

  const existedUser = await User.findOne({ email });
  if (!existedUser) {
    return res.status(400).send({
      status: false,
      message: {
        en: 'Email does not exist',
        ar: 'البريد الإلكتروني غير مسجل'
      }
    });
  }

  const randomPassword = await sendResetEmail(existedUser.email);
  console.log(randomPassword);

  existedUser.password = randomPassword;
  await existedUser.save();

  res.status(200).send({
    status: true,
    message: {
      en: 'OTP sent to your email. Please check for password reset',
      ar: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني. يرجى التحقق لإعادة تعيين كلمة المرور'
    }
  });
});


const verifyUserProfile = asyncHandler(async (req, res) => {
  const { email, otp } = req.body

  const user = await User.findOne({ email })
  if(!user) return res.status(400).send({
    message: {
      en: "User not found",
      ar: "المستخدم غير موجود"
    }
  })

  console.log("otp", otp)
  console.log("user otp", user.otp)
  if(user.otp?.toString() !== otp?.toString()) {
    return res.status(400).send({
      message: {
        en: "OTP not valid",
        ar: "رمز التحقق غير صالح"
      }
    })
  }
  user.active = true
  user.otp = ""
  await user.save()

  res.status(200).send({
    message: {
    en: "User verified successfully",
    ar: "تم التحقق من المستخدم بنجاح"
  }, user, token: generateTokenUser(user._id, user.name, user.email, user.age, user.type) })
})

const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.query

  const user = await User.findOneAndUpdate({ _id: userId }, { active: false, isDeleted: true })
  
  if(!user) {
    return res.status(400).send({
      message: {
        en: "User not found",
        ar: "المستخدم غير موجود"
      }
    })

  }

 res.status(200).send({
  message: {
    en: "User deleted successfully",
    ar: "تم حذف المستخدم بنجاح"
  }
})

  
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
