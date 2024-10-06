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


  // if (plan) {
  //   plan = Array.isArray(plan) ? plan : [plan];
  // }
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

  const courses = await Course.find({ category: category }).populate({
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
  const courses = await Course.find({}).populate({
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

const getCourseById = asyncHandler(async (req, res) => {
  const id = req.query.courseId
  const course = await Course.findById(id).populate({
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
  if (course) {
    res.status(200).json({status: true, course});
  } else {
    res.status(404);
    throw new Error("Error");
  }
})

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

      // newPlans = Array.isArray(plan) ? plan : [plan];
      // if (course.plan) {
      //   course.plan = [... new Set([...course.plan, ...newPlans])]
      // } else {
      //   course.plan = newPlans
      // }

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
  


  const courses = await Course.find({ category: { $in: categoryIds } }).populate({
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
  const livecourses = await LiveCourse.find({ category: { $in: categoryIds } }).populate({
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
  const courses = await Course.find({}).sort({
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
  

  const livecourses = await LiveCourse.find({}).sort({
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

  const courses = await Course.find({ category: { $in: categoryIds }}).sort({
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
  
  const livecourses = await LiveCourse.find({category: { $in: categoryIds }}).sort({
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
  getAllCoursesByType,
  searchAllCourses,
  topPickCourses,
  topPickCoursesByCategory
};
