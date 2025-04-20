const asyncHandler = require("express-async-handler");
const Course = require("../models/coursesModel");
const Section = require("../models/sectionModel");
const { S3Client } = require("@aws-sdk/client-s3");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Plan } = require("../models/planModel");
const Instructor = require("../models/instructorModel");
const { instructor } = require("../middleware/authMiddleware");
const Category = require("../models/category");
const LiveCourse = require("../models/liveCourseModel");
const Order = require("../models/orderModel");
const UserProgress = require("../models/userProgressModel");
const User = require("../models/userModel");
const Review = require('../models/reviewModel.js')

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
    discount,
    requirement,
    plan
  } = req.body;



  let allPlanIds
  
  if(plan) {
    const coursePlan = await Plan.findById(plan)
   
    const allPlans = await Plan.find({ level: { $gte: coursePlan.level  }})
  
    allPlanIds = allPlans.map(plan => plan._id)
  }


  const course = await Course.create({
    name,
    category,
    instructor,
    image,
    details,
    description,
    price,
    discount,
    requirement,
    plan: allPlanIds
  });
  if (course) {

    await Instructor.findByIdAndUpdate(instructor, {
      $push: { courses: course._id }
    }, {new: true})

    if (allPlanIds) {

      for (const p of allPlanIds) {

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

  const courses = await Course.find({ category: category, status: 'approved' }).populate({
    path: "sections",
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate('instructor')
    .populate('plan')
    .populate({
      path: 'reviews',
      model: 'Review',
      populate: {
        path: 'user',
        model: 'User'
      }
    })
    
  if (courses) {
    res.status(201).json(courses);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});


const getCoursesByInstructor = asyncHandler(async (req, res) => {
  const { instructor } = req.query;
  

  const courses = await Course.find({ instructor: instructor, status: 'approved'  }).populate({
    path: "sections",
    populate: [
      {
        path: "assignment",
      },
    ],
  })
  .populate('instructor')
  .populate('plan')
  .populate('category')
  .populate({
    path: 'reviews',
    model: 'Review',
    populate: {
      path: 'user',
      model: 'User'
    }
  })
  ;
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
  const pageSize = parseInt(req.query.pageSize) || 20;


  const totalCourses = await Course.countDocuments({ instructor: instructor, status: 'approved' });
  const pageCount = Math.ceil(totalCourses / pageSize);

  const courses = await Course.find({ instructor: instructor, status:'approved' }).populate({
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
  .populate('category')
  .populate({
    path: 'reviews',
    model: 'Review',
    populate: {
      path: 'user',
      model: 'User'
    }
  })
  ;
  if (courses) {
  res.status(200).json({courses, pageCount})
  } else {
    res.status(404);
    throw new Error("Error");
  }
})

const getCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({status: 'approved'}).sort({ createdAt: -1 }).populate({
    path: "sections",
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate('instructor category')
    .populate('plan')
    .populate({
      path: 'reviews',
      model: 'Review',
      populate: {
        path: 'user',
        model: 'User'
      }
    })
    ;
  if (courses) {
    res.status(201).json(courses);
  } else {
    res.status(404);
    throw new Error("Error");
  }
});

const getPendingCourses = asyncHandler(async (req, res) => {
  const pageNumber = Number(req.query.pageNumber) || 1
  const pageSize = Number(req.query.pageSize) || 20

  const totalCourses = await Course.countDocuments({status: 'pending'})
  const pageCount = Math.ceil(totalCourses/pageSize)

  const courses = await Course.find({ status: 'pending' }).sort({ createdAt: -1 }).populate({
    path: "sections",
    populate: [
      {
        path: "assignment",
      },
    ],
  })
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize)
  .populate('instructor category')
  .populate('plan')
  .populate('category')
  .populate({
    path: 'reviews',
    model: 'Review',
    populate: {
      path: 'user',
      model: 'User'
    }
  })
  if (courses) {
    res.status(200).json({courses, pageCount});
  } else {
    res.status(404);
    throw new Error("Error");
  }
});

const getCourseById = asyncHandler(async (req, res) => {
  
  const { courseId, userId } = req.query
  const id = courseId
  const course = await Course.findOne({_id: id, status: 'approved'}).populate({
    path: "sections",
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate('instructor category')
    .populate('plan')
    .populate({
      path: 'reviews',
      model: 'Review',
      populate: {
        path: 'user',
        model: 'User'
      }
    })
    ;

  const review = await Review.findOne({ user: userId, course: id })

  if (course) {
    console.log(course.sections.length)
    res.status(200).json({status: true, course: { ...course.toObject(), hasReviewed: !!review }});
  } else {
    res.status(404);
    throw new Error("Error");
  }
})

const getAllCoursesForAdmin = asyncHandler(async (req, res) => {
  const pageNumber = Number(req.query.pageNumber) || 1
  const pageSize = Number(req.query.pageSize) || 20

  const totalCourses = await Course.countDocuments({status: 'approved'})
  const pageCount = Math.ceil(totalCourses/pageSize)

  const courses = await Course.find({status: 'approved' }).populate({
    path: "sections",
    populate: [
      {
        path: "assignment",
      },
    ],
  })
  .sort({ createdAt: -1 })
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize)
  .populate('instructor category')
  .populate('plan')
  .populate('category')
  .populate({
    path: 'reviews',
    model: 'Review',
    populate: {
      path: 'user',
      model: 'User'
    }
  })
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
  const pageSize = Number(req.query.pageSize) || 20

  

  const searchCriteria = {
    instructor: instructor,
    status: 'approved',
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
   status: 'approved',
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
  .populate({
    path: 'reviews',
    model: 'Review',
    populate: {
      path: 'user',
      model: 'User'
    }
  })
  
  return res.status(200).send({status: true, message: 'Search Successfull', courses,  pageCount})
})

const searchAllPendingCourses = asyncHandler(async (req, res) => {
  const query = req.query.Query
  const pageNumber = Number(req.query.pageNumber) || 1
  const pageSize = 20;
  
  const searchCriteria = {
   status: 'pending',
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
  .populate({
    path: 'reviews',
    model: 'Review',
    populate: {
      path: 'user',
      model: 'User'
    }
  })
  
  return res.status(200).send({status: true, message: 'Search Successfull', courses,  pageCount})
})

const deleteCourse = asyncHandler(async (req, res) => {
  const subid = req.query.id;
  const instructor = req.query.instructor

  const sub = await Course.findById(subid);
  if(!sub) {
    return res.status(400).send({message: "Course not found"})
  }
  

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
    discount,
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
    course.discount = discount || course.discount
    course.plan = [] 
    let newPlans
  
    if (plan) {

      const coursePlan = await Plan.findById(plan)
      const allPlans = await Plan.find({ level: { $gte: coursePlan.level  }})
    
      newPlans = allPlans.map(plan => plan._id)
      course.plan = newPlans

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

const getAllCoursesByType = asyncHandler(async (req, res) => {
  const { type } = req.query

  const categories = await Category.find({ type });
 
  
  if (!categories.length) {
    return res.status(400).send({ status: false, message: 'No categories found' });
  }
  const categoryIds = categories.map(category => category._id);
  


  const courses = await Course.find({ category: { $in: categoryIds }, status: 'approved' }).populate({
    path: "sections",
    model: 'Section',
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate('instructor')
    .populate('category')
    .populate('plan')
    .populate({
      path: 'reviews',
      model: 'Review',
      populate: {
        path: 'user',
        model: 'User'
      }
    })
  const livecourses = await LiveCourse.find({ category: { $in: categoryIds }, status: 'approved' }).populate({
    path: "liveSections",
    model: 'LiveSection',
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate('instructor')
    .populate('category')
    .populate('plan')
    .populate({
      path: 'reviews',
      model: 'Review',
      populate: {
        path: 'user',
        model: 'User'
      }
    })

  const allCourses = [...courses, ...livecourses]
  res.status(200).send({status: true, courses, livecourses, allCourses})

})


const searchAllCourses = asyncHandler(async (req, res) => {
  const query = req.query.Query?.trim();
  const pageNumber = Number(req.query.pageNumber) || 1;
  const pageSize = 20;
  
  if (!query) {
    return res.status(400).send({ status: false, message: 'Query cannot be empty.' });
  }
  
  const searchCriteria = {
    status: 'approved',
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { details: { $regex: query, $options: 'i' } }
    ]
  };

  const totalCourses = await Course.countDocuments(searchCriteria);
  const courses = await Course.find(searchCriteria)
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .populate({
      path: "sections",
      model: 'Section',
      populate: [
        {
          path: "assignment",
        },
      ],
    }).populate('instructor')
      .populate('category')
      .populate('plan')
      .populate({
        path: 'reviews',
        model: 'Review',
        populate: {
          path: 'user',
          model: 'User'
        }
      })
    

  const totalLiveCourses = await LiveCourse.countDocuments(searchCriteria);
  const liveCourses = await LiveCourse.find(searchCriteria)
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .populate({
      path: "liveSections",
      model: 'LiveSection',
      populate: [
        {
          path: "assignment",
        },
      ],
    }).populate('instructor')
      .populate('category')
      .populate('plan')
      .populate({
        path: 'reviews',
        model: 'Review',
        populate: {
          path: 'user',
          model: 'User'
        }
      })
  

  const allCourses = [...courses, ...liveCourses];
  const totalCoursesCount = totalCourses + totalLiveCourses;
  const pageCount = Math.ceil(totalCoursesCount / pageSize);

  return res.status(200).send({
    status: true,
    message: 'Search Successful',
    courses,
    liveCourses,
    allCourses,
    pageCount
  });
});

const topPickCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({status: 'approved'}).sort({
    enrolledStudentsCount: -1
  }).limit(20).populate({
    path: "sections",
    model: 'Section',
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate('instructor')
    .populate('category')
    .populate('plan')
    .populate({
      path: 'reviews',
      model: 'Review',
      populate: {
        path: 'user',
        model: 'User'
      }
    })
  

  const livecourses = await LiveCourse.find({ status: 'approved' }).sort({
    enrolledStudentsCount: -1
  }).limit(20).populate({
    path: "liveSections",
    model: 'LiveSection',
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate('instructor')
    .populate('category')
    .populate('plan')
    .populate({
      path: 'reviews',
      model: 'Review',
      populate: {
        path: 'user',
        model: 'User'
      }
    })

  const allCourses = [...courses, ...livecourses]

  res.status(200).send({status: true, courses, livecourses, allCourses})
})

const topPickCoursesByCategory = asyncHandler(async (req, res) => {
  const { categoryType } = req.query
  const categories = await Category.find({ type: categoryType })

  if(!categories.length) {
    return res.status(404).json({
      status: false,
      message: 'No Courses with this Category found'
    })
  }

  const categoryIds = categories.map((category) => category._id)

  const courses = await Course.find({ category: { $in: categoryIds }, status: 'approved'}).sort({
    enrolledStudentsCount: -1
  }).limit(20).populate({
    path: "sections",
    model: 'Section',
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate('instructor')
    .populate('category')
    .populate('plan')
    .populate({
      path: 'reviews',
      model: 'Review',
      populate: {
        path: 'user',
        model: 'User'
      }
    })
  
  const livecourses = await LiveCourse.find({category: { $in: categoryIds }, status: 'approved'}).sort({
    enrolledStudentsCount: -1
  }).limit(20).populate({
    path: "liveSections",
    model: 'LiveSection',
    populate: [
      {
        path: "assignment",
      },
    ],
  }).populate('instructor')
    .populate('category')
    .populate('plan')
    .populate({
      path: 'reviews',
      model: 'Review',
      populate: {
        path: 'user',
        model: 'User'
      }
    })
    const allCourses = [...courses, ...livecourses]

    res.status(200).send({status: true, courses, livecourses, allCourses})
})

const updateUserProgress = asyncHandler(async (req, res) => {
  const { userId, courseId, sectionId } = req.body
  console.log("running user progress update")
  if(!userId || !courseId || !sectionId) return res.status(400).send({ message: 'All Fields are required' })

  const course = await Course.findOne({ _id: courseId }).select('sections')

  if (!course || course.sections.length === 0) {
    return res.status(400).send({ message: 'Course or Course Sections not found' });
  }


  const userProgressExist = await UserProgress.findOne({ user: userId, course: courseId, 'viewedSections.section': sectionId })
  if(userProgressExist) return res.status(400).send({ message: 'Section Already Viewed' })

  const userProgress = await UserProgress.findOneAndUpdate({ user: userId, course: courseId }, {$addToSet: {
    viewedSections: { section: sectionId,  viewedAt: new Date() }
  }}, { new: true })


  if(!userProgress) return res.status(400).send({ message: 'User Progress Details not found' })

  
  const totalSections = course.sections.length
 
  const userViewedSections = userProgress.viewedSections?.length || 0
  let progressPercentage = (userViewedSections/totalSections) * 100
  progressPercentage = parseFloat(progressPercentage.toFixed(2));
  progressPercentage = Math.min(progressPercentage, 100);

  userProgress.courseCompletePercentage = progressPercentage
  await userProgress.save()

  const viewedSectionCount = userProgress.viewedSections.length > 0 ? userProgress.viewedSections.length : 0
  const totalSectionsCount = course.sections.length || 0
  

  res.status(200).send({ userProgress, courseCompletePercentage: progressPercentage, viewedSectionCount, totalSectionsCount  })
  
})

const checkUserUpdateProgress = asyncHandler(async (req, res) => {
  const { userId, courseId } = req.query
  console.log("running progress update")
  if(!userId || !courseId) return res.status(400).send({ message: 'All Fields are required' })

  const userProgress = await UserProgress.findOne({ user: userId, course: courseId })
  if(!userProgress) {
      return res.status(400).send({ message: 'User Progress not found' });
  }


  
  const course = await Course.findOne({ _id: courseId }).select('sections')

  if (!course || course.sections.length === 0) {
    return res.status(400).send({ message: 'Course or Course Sections not found' });
  }

  const courseCompletePercentage = userProgress.courseCompletePercentage
  const viewedSectionCount = userProgress.viewedSections?.length > 0 ? userProgress.viewedSections.length : 0
  const totalSectionsCount = course.sections.length || 0

  res.status(200).send({ userProgress, courseCompletePercentage, viewedSectionCount, totalSectionsCount})

})

const syncInstructorCourses = asyncHandler(async (req, res) => {
  const { instructorId } = req.query;

  const instructor = await Instructor.findById(instructorId);

  if (!instructor) {
    return res.status(404).json({ message: 'Instructor not found' });
  }

  const [existingCourses, existingLiveCourses] = await Promise.all([
    Course.find({ instructor: instructorId }),
    LiveCourse.find({ instructor: instructorId })
  ]);

  const validCourseIds = existingCourses.map(c => c._id.toString());
  const validLiveCourseIds = existingLiveCourses.map(lc => lc._id.toString());

  const filteredCourseIds = instructor.courses.filter(id =>
    validCourseIds.includes(id.toString())
  );

  const filteredLiveCourseIds = instructor.livecourses.filter(id =>
    validLiveCourseIds.includes(id.toString())
  );

  const isCoursesChanged = filteredCourseIds.length !== instructor.courses.length;
  const isLiveCoursesChanged = filteredLiveCourseIds.length !== instructor.livecourses.length;

  if (isCoursesChanged || isLiveCoursesChanged) {
    instructor.courses = filteredCourseIds;
    instructor.livecourses = filteredLiveCourseIds;
    await instructor.save();
  }

  res.status(200).json({
    message: 'Instructor course references synced successfully',
    validCourses: validCourseIds,
    validLiveCourses: validLiveCourseIds
  });
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
  getAllCoursesForAdmin,
  getCourseById,
  getPendingCourses,
  getAllCoursesByType,
  searchAllCourses,
  topPickCourses,
  topPickCoursesByCategory,
  updateUserProgress,
  checkUserUpdateProgress,
  searchAllPendingCourses,
  syncInstructorCourses
};
