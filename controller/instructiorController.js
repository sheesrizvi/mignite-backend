const asyncHandler = require("express-async-handler");
const { generateTokenInstructor } = require("../utils/generateToken.js");
const Instructor = require("../models/instructorModel.js");
const { createMeeting } = require("../middleware/meetingLinkGenerate.js");
const LiveSection = require("../models/liveSectionModel.js");
const LiveCourse = require("../models/liveCourseModel.js");
const Course = require("../models/coursesModel.js");
const { startOfMonth, endOfMonth, startOfDay, endOfDay } = require('date-fns');
const mongoose = require('mongoose');
const { populate } = require("dotenv");
const { instructor } = require("../middleware/authMiddleware.js");
const Order = require("../models/orderModel.js");
const generator = require('generate-password')
const { sendResetEmail, sendVerificationEmail } = require("../middleware/handleEmail.js");

// @desc    Auth user & get token
// @route   POST /api/users/login
//  @access   Public

const authInstructor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const instructor = await Instructor.findOne({ email });

  if (instructor && (await instructor.matchPassword(password))) {
    
    if(!instructor || instructor.isDeleted) {
      return res.status(400).send({ message: "Instructor not found" })
    }

    
  let otp = Math.floor(1000000000 + Math.random() * 9000000000);
  console.log(otp);
  

    if(!instructor.active) {
      sendVerificationEmail(instructor.otp, instructor.email)
      instructor.otp = otp
      await instructor.save()
      return res.status(400).send({ profileNotVerified: true, message: 'OTP Sent. Please verify your profile first' })
    }

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
  const { name, email, password, description, phone , profileImage, resume} = req.body;

  const userExists = await Instructor.findOne({ email });
  if(userExists && !userExists.isDeleted) {
    res.status(404);
    throw new Error("Instructor already exists");
  }

  
  let otp = Math.floor(1000000000 + Math.random() * 9000000000);
  console.log(otp);


  if (userExists && userExists.isDeleted) {
    userExists.name = name
    userExists.password = password
    userExists.description = description
    userExists.phone = phone
    userExists.profileImage = profileImage
    userExists.otp = otp
    userExists.resume = resume

    await userExists.save()

    sendVerificationEmail(userExists.otp, userExists.email)
    res.json({
      _id: instructor._id,
      name: instructor.name,
      email: instructor.email,
      //token: generateTokenInstructor(instructor._id, instructor.name, instructor.email, instructor.type),
      message:'Instructor created succesfully, Please wait till admin approval and verification email sent'
    });

  }
 

  const instructor = await Instructor.create({
    name,
    email,
    password,
    phone,
    description,
    otp,
    profileImage,
    resume
  });

  if (instructor) {
   
    sendVerificationEmail(instructor.otp, instructor.email)
    res.json({
        _id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        //token: generateTokenInstructor(instructor._id, instructor.name, instructor.email, instructor.type),
        message:'Instructor created succesfully, Please wait till admin approval and verification email sent'
      });
  } else {
    res.status(404);
    throw new Error("Invalid instructor data");
  }
});


const updateInstructor = asyncHandler(async (req, res) => {
  const { instructorId, name, email, description, phone, profileImage, active, resume } = req.body;

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
  instructor.profileImage = profileImage || instructor.profileImage
  instructor.resume = resume || instructor.resume

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
    const instructors = await Instructor.find({status: 'approved'}).sort({ createdAt: -1 })
    return res.status(200).json({
      status: true,
      message: {
        en: "All instructors list",
        ar: "قائمة جميع المدربين"
      },
      instructors,
      pageCount,
    });
  }

  const instructors = await Instructor.find({status: 'approved'}).sort({ createdAt: -1 }).skip((pageNumber -1) * pageSize).limit(pageSize)
  if(instructors.length === 0) {
   return res.status(400).send({
      success: false,
      message: {
        en: "Instructor not found",
        ar: "لم يتم العثور على المدرب"
      }
    })

  }

  res.status(200).send({
      status: true,
      message: {
        en: "Instructor list",
        ar: "قائمة المدربين"
      },
      instructors,
      pageCount
  })

})

const getAllInstructorForDownload = asyncHandler(async (req, res) => {

  const instructors = await Instructor.find({status: 'approved'}).sort({createdAt: -1 })
  if(instructors.length === 0) {
    return res.status(400).send({success: false, message: 'Instructor Not Found'})
  }

  res.status(200).send({status: true, message: 'Instructor List', instructors})
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

const fetchPendingInstructorBySearch = asyncHandler(async (req, res) => {
  const query = req.query.Query
  const pageNumber = Number(req.query.pageNumber) || 1
  const pageSize = 20;
 
  const searchCriteria = {
   status: 'pending',
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
  // if(instructor.courses.length > 0) {
  //   return res.status(400).send({success: false, message: "Delete courses first"})
  // }
  
  if(instructor.livecourses.length > 0) {
    return res.status(400).send({success: false, message: "Delete live courses first"})
  }
  await Instructor.findOneAndUpdate({ _id: id }, { isDeleted: true, active: false })
  res.status(200).send({status: true, message: 'Instructor Deleted successfully'})
})

// const getInstructorData = asyncHandler(async (req, res) => {
//   const instructor = req.query.instructor 
  
//   const instructorDetails = await Instructor.findById(instructor)

//   if(!instructorDetails) return res.status(400).send({message: "Instructor not found"})

//   const courses = await Course.find({instructor, status: 'approved'}).populate('instructor plan category').populate({
//     path: 'sections',
//     model: 'Section',
//     populate: [
//       {
//         path: "assignment",
//       },
//     ],
//   }).populate({
//     path: 'enrolledStudents',
//     model: 'User'
//   })

//   const coursesCount = await Course.countDocuments({instructor, status: 'approved'})

//   const livecourses = await LiveCourse.find({instructor, status: 'approved'}).populate('instructor plan category').populate({
//     path: 'liveSections',
//     model: 'LiveSection'
//   }).populate({
//     path: 'enrolledStudents',
//     model: 'User'
//   })

//   const livecourseCount = await LiveCourse.countDocuments({instructor, status: 'approved'})

//   const enrolledStudentsInCourseCount = courses.reduce((sum, course) => {
//     return sum += course.enrolledStudentsCount
//   }, 0)
//   const enrolledStudentsInLiveCourseCount = livecourses.reduce((sum, course) => {
//    return sum += course.enrolledStudentsCount
//   }, 0)

//  const totalCourseCount = coursesCount + livecourseCount
//  const totalEnrolledStudents = enrolledStudentsInCourseCount + enrolledStudentsInLiveCourseCount
//  const allCourses = [...courses, ...livecourses]
//  res.status(200).send({ 
//     coursesCount, livecourseCount, totalCourseCount, enrolledStudentsInCourseCount,          
//     enrolledStudentsInLiveCourseCount, totalEnrolledStudents,
//     courses, livecourses , allCourses, instructor: instructorDetails
//   })
// })

const getInstructorData = asyncHandler(async (req, res) => {
  const instructorId = req.query.instructor;

  const instructorDetails = await Instructor.findById(instructorId);

  if (!instructorDetails) {
    return res.status(400).send({ message: "Instructor not found" });
  }

  const [courses, livecourses] = await Promise.all([
    Course.find({ instructor: instructorId, status: 'approved' })
      .populate('instructor plan category')
      .populate({
        path: 'sections',
        model: 'Section',
        populate: [{ path: 'assignment' }],
      })
      .populate({
        path: 'enrolledStudents',
        model: 'User',
      }),

    LiveCourse.find({ instructor: instructorId, status: 'approved' })
      .populate('instructor plan category')
      .populate({
        path: 'liveSections',
        model: 'LiveSection',
      })
      .populate({
        path: 'enrolledStudents',
        model: 'User',
      })
  ]);

  const [coursesCount, livecourseCount] = await Promise.all([
    Course.countDocuments({ instructor: instructorId, status: 'approved' }),
    LiveCourse.countDocuments({ instructor: instructorId, status: 'approved' })
  ]);

  const enrolledStudentsInCourseCount = courses.reduce(
    (sum, course) => sum + course.enrolledStudentsCount,
    0
  );
  const enrolledStudentsInLiveCourseCount = livecourses.reduce(
    (sum, course) => sum + course.enrolledStudentsCount,
    0
  );

  const totalCourseCount = coursesCount + livecourseCount;
  const totalEnrolledStudents = enrolledStudentsInCourseCount + enrolledStudentsInLiveCourseCount;
  const allCourses = [...courses, ...livecourses];

  const courseIdsInResponse = new Set(courses.map(c => c._id.toString()));
  const livecourseIdsInResponse = new Set(livecourses.map(lc => lc._id.toString()));

  const instructorCoursesFiltered = instructorDetails.courses.filter(cId =>
    courseIdsInResponse.has(cId.toString())
  );

  const instructorLiveCoursesFiltered = instructorDetails.livecourses.filter(lcId =>
    livecourseIdsInResponse.has(lcId.toString())
  );

  res.status(200).send({
    coursesCount,
    livecourseCount,
    totalCourseCount,
    enrolledStudentsInCourseCount,
    enrolledStudentsInLiveCourseCount,
    totalEnrolledStudents,
    courses,
    livecourses,
    allCourses,
    instructor: {
      ...instructorDetails.toObject(),
      courses: instructorCoursesFiltered,
      livecourses: instructorLiveCoursesFiltered,
    }
  });
});


const getInstructorById = asyncHandler(async (req, res) => {
  const instructor = req.query.instructor 
  console.log(req.query)
  const instructorDetails = await Instructor.findById(instructor)

  if(!instructorDetails) return res.status(400).send({message: "Instructor not found"})

  res.status(200).send({instructor: instructorDetails})
})

const getInstructorSalesData = asyncHandler(async (req, res) => {
  const { instructor } = req.query;
  const now = new Date();
  const s1 = startOfMonth(now);
  const s2 = endOfMonth(now);
  const pageSize = 30;
  const page = Number(req.query.pageNumber) || 1;

  const count = await Order.countDocuments({
    'orderCourses.instructor': instructor,
    isPaid: true,
    deliveryStatus: "Enrolled",
  });
  
  let pageCount = Math.floor(count / 30);
  if (count % 30 !== 0) {
    pageCount += 1;
  }

  const monthlySales = await Order.find({
    $and: [
      { 'orderCourses.instructor': instructor },
      { createdAt: { $gte: startOfDay(s1), $lte: endOfDay(s2) } },
      { isPaid: true },
      { deliveryStatus: "Enrolled" },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate("user", "name")
    .populate("orderCourses.courseInfo.course")

  const monthlySalesRevenue = monthlySales.reduce((total, order) => {
    const instructorRevenue = order.orderCourses
      .filter(course => course.instructor.toString() === instructor)
      .reduce((sum, course) => sum + course.finalprice, 0);
    return total + instructorRevenue;
  }, 0).toFixed(2);

  const totalSales = await Order.find({
    $and: [
      { 'orderCourses.instructor': instructor },
      { isPaid: true },
      { deliveryStatus: "Enrolled" },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate("user", "name")
    .populate("orderCourses.courseInfo.course")

  const totalSalesRevenue = totalSales.reduce((total, order) => {
    const instructorRevenue = order.orderCourses
      .filter(course => course.instructor.toString() === instructor)
      .reduce((sum, course) => sum + course.finalprice, 0);
    return total + instructorRevenue;
  }, 0).toFixed(2);

  res.json({
    pageCount,
    currentMonthSalesRevenue: Number(monthlySalesRevenue),
    totalSalesRevenue: Number(totalSalesRevenue),
    monthlySales,
    totalSales,
  });
});



const getSalesHistory = asyncHandler(async (req, res) => {
  const { instructor } = req.query;
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const orders = await Order.find({
    'orderCourses.instructor': instructor,
    isPaid: true,
    deliveryStatus: "Enrolled",
    createdAt: { $gte: startOfYear, $lte: now },
  })
    .populate("user", "name")
    .populate("orderCourses.courseInfo.course")

  let monthlySalesHistory = {};

  orders.forEach(order => {
    const createdAt = new Date(order.createdAt);
    const year = createdAt.getFullYear();
    const month = createdAt.getMonth() + 1;
    const key = `${year}-${month}`;
   
    order.orderCourses.forEach(course => {
      if (course.instructor.toString() === instructor) {
        if (monthlySalesHistory[key]) {
          monthlySalesHistory[key] += course.finalprice;
        } else {
          monthlySalesHistory[key] = course.finalprice;
        }
      }
    });
  });

  monthlySalesHistory = Object.keys(monthlySalesHistory).map(key => ({
    month: key,
    totalRevenue: parseFloat(monthlySalesHistory[key].toFixed(2)),
  }));

  res.json({
    monthlySalesHistory,
  });
});



const getInstructorPendingData = asyncHandler(async (req, res) => {
  const instructor = req.query.instructor 

  const courses = await Course.find({instructor, status: 'pending'}).populate('instructor plan category').populate({
    path: 'sections',
    model: 'Section',
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate({
    path: 'enrolledStudents',
    model: 'User'
  })

  const coursesCount = await Course.countDocuments({instructor, status: 'pending'})

  const livecourses = await LiveCourse.find({instructor, status: 'pending'}).populate('instructor plan category').populate({
    path: 'liveSections',
    model: 'LiveSection'
  }).populate({
    path: 'enrolledStudents',
    model: 'User'
  })

  const livecourseCount = await LiveCourse.countDocuments({instructor, status: 'pending'})

  const enrolledStudentsInCourseCount = courses.reduce((sum, course) => {
    return sum += course.enrolledStudentsCount
  }, 0)
  const enrolledStudentsInLiveCourseCount = livecourses.reduce((sum, course) => {
   return sum += course.enrolledStudentsCount
  }, 0)

 const totalCourseCount = coursesCount + livecourseCount
 const totalEnrolledStudents = enrolledStudentsInCourseCount + enrolledStudentsInLiveCourseCount
 res.status(200).send({ 
    coursesCount, livecourseCount, totalCourseCount, enrolledStudentsInCourseCount,          
    enrolledStudentsInLiveCourseCount, totalEnrolledStudents,
    courses, livecourses 
  })
})

const getTopInstructors = async (req, res) => {
  const topInstructors = await Instructor.aggregate([
    {
      $lookup: {
        from: 'courses',
        let: { instructorId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$instructor', '$$instructorId'] },
              status: 'approved',
            },
          },
        ],
        as: 'courses',
      },
    },
    {
      $lookup: {
        from: 'livecourses',
        let: { instructorId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$instructor', '$$instructorId'] },
              status: 'approved',
            },
          },
        ],
        as: 'livecourses',
      },
    },
    {
      $addFields: {
        courseCount: { $size: '$courses' },
        liveCourseCount: { $size: '$livecourses' },
        totalCourseCount: { $add: [{ $size: '$courses' }, { $size: '$livecourses' }] },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'courses.category',
        foreignField: '_id',
        as: 'courseCategories',
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'livecourses.category',
        foreignField: '_id',
        as: 'liveCourseCategories',
      },
    },
    {
      $addFields: {
        categories: {
          $setUnion: ['$courseCategories.name', '$liveCourseCategories.name'],
        },
      },
    },
    {
      $lookup: {
        from: 'reviews',
        let: {
          courseIds: { $map: { input: '$courses', as: 'c', in: '$$c._id' } },
          liveCourseIds: { $map: { input: '$livecourses', as: 'lc', in: '$$lc._id' } },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $in: ['$course', '$$courseIds'] },
                  { $in: ['$livecourse', '$$liveCourseIds'] },
                ],
              },
            },
          },
        ],
        as: 'allReviews',
      },
    },
    {
      $addFields: {
        reviewsCount: { $size: '$allReviews' },
        enrolledStudentsCount: {
          $sum: [
            { $sum: '$courses.enrolledStudentsCount' },
            { $sum: '$livecourses.enrolledStudentsCount' },
          ],
        },
      },
    },
    {
      $sort: { enrolledStudentsCount: -1, reviewsCount: -1 },
    },
    {
      $limit: 6,
    },
    {
      $project: {
        name: 1,
        email: 1,
        profileImage: 1,
        courseCount: '$totalCourseCount',
        reviewsCount: 1,
        enrolledStudentsCount: 1,
        categories: 1,
        courses: 1,
        livecourses: 1,
      },
    },
  ]);

  res.status(200).send({
    success: true,
    data: topInstructors,
  });
};


// const getTopInstructors = async (req, res) => {
//   const topInstructors = await Instructor.aggregate([
//     {
//       $lookup: {
//         from: 'courses',
//         localField: '_id',
//         foreignField: 'instructor',
//         as: 'courses',
//       },
//     },
//     {
//       $lookup: {
//         from: 'livecourses',
//         localField: '_id',
//         foreignField: 'instructor',
//         as: 'livecourses',
//       },
//     },
//     {
//       $addFields: {
//         courseCount: { $size: '$courses' },
//         liveCourseCount: { $size: '$livecourses' },
//         totalCourseCount: { $add: [{ $size: '$courses' }, { $size: '$livecourses' }] },
//       },
//     },
//     {
//       $lookup: {
//         from: 'categories',
//         localField: 'courses.category',
//         foreignField: '_id',
//         as: 'courseCategories',
//       },
//     },
//     {
//       $lookup: {
//         from: 'categories',
//         localField: 'livecourses.category',
//         foreignField: '_id',
//         as: 'liveCourseCategories',
//       },
//     },
//     {
//       $addFields: {
//         categories: {
//           $setUnion: ['$courseCategories.name', '$liveCourseCategories.name'],
//         },
//       },
//     },
//     {
//       $lookup: {
//         from: 'reviews',
//         let: { courseIds: { $ifNull: ['$courses._id', []] }, liveCourseIds: { $ifNull: ['$livecourses._id', []] } },
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $or: [
//                   { $in: ['$course', '$$courseIds'] },
//                   { $in: ['$livecourse', '$$liveCourseIds'] },
//                 ],
//               },
//             },
//           },
//         ],
//         as: 'allReviews',
//       },
//     },
//     {
//       $addFields: {
//         reviewsCount: { $size: '$allReviews' },
//         enrolledStudentsCount: {
//           $sum: [
//             { $sum: '$courses.enrolledStudentsCount' },
//             { $sum: '$livecourses.enrolledStudentsCount' },
//           ],
//         },
//       },
//     },
//     {
//       $sort: { enrolledStudentsCount: -1, reviewsCount: -1 },
//     },
//     {
//       $limit: 6
//     },
//     {
//       $project: {
//         name: 1,
//         email: 1,
//         courseCount: '$totalCourseCount',
//         reviewsCount: 1,
//         enrolledStudentsCount: 1,
//         categories: 1,
//       },
//     },
//   ]);

//   res.status(200).send({
//     success: true,
//     data: topInstructors,
//   });
// };

const getInstructorDataById = asyncHandler(async (req, res) => {
  const { instructor } = req.query;

  const instructorDetails = await Instructor.findOne({ _id: instructor })
    .populate({
      path: 'courses',
      match: { status: 'approved' },
      populate: [
        {
          path: 'reviews',
          populate: [
            { path: 'user' },
            { path: 'course' }
          ]
        },
        { path: 'instructor' },
        { path: 'category' },
        {
          path: 'sections',
          populate: { path: 'assignment' }
        }
      ]
    })
    .populate({
      path: 'livecourses',
      match: { status: 'approved' },
      populate: [
        {
          path: 'reviews',
          populate: [
            { path: 'user' },
            { path: 'course' }
          ]
        },
        { path: 'instructor' },
        { path: 'category' },
        { path: 'plan' },
        { path: 'liveSections' }
      ]
    });

  if (!instructorDetails) {
    return res.status(400).send({
      message: {
        en: "No instructor found",
        ar: "لم يتم العثور على أي مدرب"
      }
    })

  }

  res.status(200).send({
   message: {
    en: "Instructor",
    ar: "المدرب"
  },
    instructor: instructorDetails
  });
});


// const getInstructorDataById = asyncHandler(async (req, res) => {
//   const { instructor } = req.query
//   const instructorDetails = await Instructor.findOne({_id: instructor}).populate({
//     path: 'courses',
//     populate: [
//       {
//         path: 'reviews',
//         populate: [
//           {
//             path: 'user'
//           },
//           {
//             path: 'course'
//           }
//         ]
//       },
//       {
//         path: 'instructor'
//       },
//       {
//         path: 'category'
//       },
//       {
//         path: 'sections',
//         populate: {
//           path: 'assignment'
//         }
//       }
//     ]
      
    
//   }).populate({
//     path: 'livecourses',
//     populate: [
//       {
//         path: 'reviews',
//         populate: [
//           {
//             path: 'user'
//           },
//           {
//             path: 'course'
//           }
//         ]
//       },
//       {
//         path: 'instructor'
//       },
//       {
//         path: 'category'
//       },
//       {
//         path: 'plan'
//       },
//       {
//         path: 'liveSections'
//       }
//     ]
//   })

//   if(!instructorDetails) return res.status(400).send({ message: 'No Instructor found' })

//   res.status(200).send({ message: 'Instructor', instructor: instructorDetails })
// })

// const getInstructorDataById = asyncHandler(async (req, res) => {
//   const { instructor } = req.query;

//  
//   const instructorDetails = await Instructor.findOne({ _id: instructor })
//     .populate({
//       path: 'courses',
//       populate: [
//         {
//           path: 'reviews',
//           populate: [
//             {
//               path: 'user',
//             },
//             {
//               path: 'course',
//             },
//           ],
//         },
//         {
//           path: 'instructor',
//         },
//         {
//           path: 'category',
//         },
//         {
//           path: 'sections',
//           populate: {
//             path: 'assignment',
//           },
//         },
//       ],
//     })
//     .populate({
//       path: 'livecourses',
//       populate: [
//         {
//           path: 'reviews',
//           populate: [
//             {
//               path: 'user',
//             },
//             {
//               path: 'course',
//             },
//           ],
//         },
//         {
//           path: 'instructor',
//         },
//         {
//           path: 'category',
//         },
//         {
//           path: 'plan',
//         },
//         {
//           path: 'liveSections',
//         },
//       ],
//     });

//   if (!instructorDetails) {
//     return res.status(400).send({ message: 'No Instructor found' });
//   }

//   
//   const [actualCourses, actualLiveCourses] = await Promise.all([
//     Course.find({ instructor, status: 'approved' }),
//     LiveCourse.find({ instructor, status: 'approved' }),
//   ]);

//   
//   const actualCourseIds = actualCourses.map(c => c._id.toString());
//   const actualLiveCourseIds = actualLiveCourses.map(lc => lc._id.toString());

// 
//   const filteredCourses = instructorDetails.courses.filter(course =>
//     actualCourseIds.includes(course._id.toString())
//   );

//   const filteredLiveCourses = instructorDetails.livecourses.filter(livecourse =>
//     actualLiveCourseIds.includes(livecourse._id.toString())
//   );

//  
//   res.status(200).send({
//     message: 'Instructor',
//     instructor: {
//       ...instructorDetails.toObject(),
//       courses: filteredCourses,
//       livecourses: filteredLiveCourses,
//     },
//   });
// });


const verifyInstructorProfile = asyncHandler(async (req, res) => {
  const { email, otp } = req.body

  const instructor = await Instructor.findOne({ email })
  if(!instructor) return res.status(400).send({message: 'Instructor not found'})

  if(instructor.otp?.toString() !== otp?.toString()) return res.status(400).send({ message: 'OTP not valid' })
  instructor.active = true
  instructor.otp = ""
  await instructor.save()
  res.status(200).send({ message: 'Instructor verified successfully', instructor, token: generateTokenInstructor(instructor._id, instructor.name, instructor.email, instructor.type ), })
})

const resetPassword = asyncHandler(async(req, res) => {
  const {  email } = req.body
  if(!email) {
      return res.status(400).send({status:true, message: 'Email not Found'})
  }
  const existedInstructor = await Instructor.findOne({email})
  if(!existedInstructor) {
      return res.status(400).send({status: false, message: 'Email not exist'})
  }
  
  const randomPassword = await sendResetEmail(existedInstructor.email)
  existedInstructor.password = randomPassword
  await existedInstructor.save()
  res.status(200).send({status: true, message: 'Check Your Email for Password Reset'})
})


module.exports = {
  authInstructor,
  registerInstructor,
  getAllInstructor,
  fetchInstructorBySearch,
  deleteInstructor,
  updateInstructor,
  getPendingInstructor,
  getInstructorData,
  getSalesHistory,
  getInstructorPendingData,
  getTopInstructors,
  getInstructorSalesData,
  getInstructorDataById,
  verifyInstructorProfile,
  resetPassword,
  getInstructorById,
  fetchPendingInstructorBySearch,
  getAllInstructorForDownload
};
