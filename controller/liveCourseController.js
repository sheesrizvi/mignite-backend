const asyncHandler = require("express-async-handler");
const LiveCourse = require("../models/liveCourseModel");
const { instructor } = require("../middleware/authMiddleware");
const Category = require("../models/category");
const { Plan } = require("../models/planModel");
const Instructor = require("../models/instructorModel");
const LiveSection = require("../models/liveSectionModel");
const { subDays } = require("date-fns");
const { agenda } = require("../jobs/agendaConnection");
const Review = require('../models/reviewModel.js')

const createLiveCourse = asyncHandler(async (req, res) => {
  
  let {
    name,
    category,
    details,
    price,
    discount,
    description,
    batchSize,
    requirement,
    startDate,
    endDate, image,
    instructor,
    plan
  } = req.body;

  let allPlanIds
  if(plan) {
    const coursePlan = await Plan.findById(plan)
    const allPlans = await Plan.find({ level: { $gte: coursePlan.level  }})
  
    allPlanIds = allPlans.map(plan => plan._id)
  }

  const liveCourse = await LiveCourse.create({
    name,
    category,
    details,
    price,
    discount,
    description,
    batchSize,
    requirement,
    startDate,
    endDate,
    instructor,
    image,
    plan: allPlanIds
  });
 
  if (liveCourse) {
   // Instructor LiveCourse Added

   await Instructor.findByIdAndUpdate(instructor, {
    $push: { livecourses: liveCourse._id }
  }, {new: true})

    if(plan) {
      for(const p of allPlanIds) {
        await Plan.findByIdAndUpdate(p, {
          $push : { liveCourses: liveCourse._id }
        }, { new: true })
      }
    }
   
      const now = new Date();
      const afterOneMin = new Date(now.getTime() + 1 * 60 * 1000)
     
          const sevenDaysBefore = subDays(startDate, 7);
          const msg = {
            title: `Course Start`,
            body: `Hurray!! Your ${liveCourse.name} Course will start in 7 days!!`
          }
     
      await agenda.schedule(sevenDaysBefore, 'send-notification-before-course-start', { courseId: '66efe23a48b088262386aa65', msg })

    res.status(201).json(liveCourse);
  } else {
    res.status(400);
    throw new Error("Unable to create live course");
  }
});

const getLiveCoursesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const liveCourses = await LiveCourse.find({ category, status: 'approved' }).populate('category instructor plan')
  .populate({
    path: 'liveSections',
    populate: [
      {
        path: 'instructor',
        model: 'Instructor'
      },
      {
        path: 'liveCourse',
        model: 'LiveCourse'
      },
      {
        path: 'assignment',
        model: 'Assignment'
      }
    ]
  })
  .populate({
    path: 'reviews',
    populate: {
      path: 'user',
      model: 'User'
    }
  });

  if (liveCourses.length) {
    res.status(200).json(liveCourses);
  } else {
    res.status(404);
    throw new Error("No courses found for this category");
  }
});


const getLiveCourses = asyncHandler(async (req, res) => {
  const liveCourses = await LiveCourse.find({status: 'approved'}).sort({ createdAt: -1 }).populate('category instructor plan')
  .populate({
    path: 'liveSections',
    model: 'LiveSection',
    populate: [
      {
        path: 'instructor',
        model: 'Instructor'
      },
      {
        path: 'liveCourse',
        model: 'LiveCourse'
      },
      {
        path: 'assignment',
        model: 'Assignment'
      }
    ]
  })
  .populate({
    path: 'reviews',
    populate: {
      path: 'user',
      model: 'User'
    }
  });

  if (liveCourses.length) {
    res.status(200).json({
      message: {
        en: "LiveCourses found",
        ar: "تم العثور على دورات مباشرة"
      },
      liveCourses 
    });
  } else {
   return res.status(404).json({
      message: {
        en: "No live courses available",
        ar: "لا توجد دورات مباشرة متاحة"
      }
    })

  }
});

const getLiveCourseById = asyncHandler(async (req, res) => {
  const { courseId , userId } = req.query
  const id = courseId
  const liveCourse = await LiveCourse.findOne({_id: id, status: 'approved'}).populate('category instructor plan')
  .populate({
    path: 'liveSections',
    populate: [
      {
        path: 'instructor',
        model: 'Instructor'
      },
      {
        path: 'liveCourse',
        model: 'LiveCourse'
      },
      {
        path: 'assignment',
        model: 'Assignment'
      }
    ]
  })
  .populate({
    path: 'reviews',
    populate: {
      path: 'user',
      model: 'User'
    }
  });

  const review = await Review.findOne({ user: userId, course: courseId })

  if (liveCourse) {
    res.status(200).json({status: true, liveCourse: { ...liveCourse.toObject(), hasReviewed: !!review }});
  } else {
    res.status(404);
    throw new Error("No live courses available");
  }
});


const getAllLiveCoursesForAdmin = asyncHandler(async (req, res) => {
  const pageNumber = Number(req.query.pageNumber) || 1
  const pageSize = Number(req.query.pageSize) || 20

  const totalCourses = await LiveCourse.countDocuments({status: 'approved'})
  const pageCount = Math.ceil(totalCourses/pageSize)

  const livecourses = await LiveCourse.find({status: 'approved'})
  .sort({ createdAt: -1 })
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize)
  .populate('category instructor plan')
  .populate({
    path: 'liveSections',
    populate: [
      {
        path: 'instructor',
        model: 'Instructor'
      },
      {
        path: 'liveCourse',
        model: 'LiveCourse'
      },
      {
        path: 'assignment',
        model: 'Assignment'
      }
    ]
  })
  .populate({
    path: 'reviews',
    populate: {
      path: 'user',
      model: 'User'
    }
  });
  if (livecourses) {
    res.status(200).json({livecourses, pageCount});
  } else {
    res.status(404);
    throw new Error("Error");
  }
});


const getAllPendingLiveCoursesForAdmin = asyncHandler(async (req, res) => {
  const pageNumber = Number(req.query.pageNumber) || 1
  const pageSize = Number(req.query.pageSize) || 20

  const totalCourses = await LiveCourse.countDocuments({status: 'pending'})
  const pageCount = Math.ceil(totalCourses/pageSize)

  const livecourses = await LiveCourse.find({status: 'pending'})
  .sort({ createdAt: -1 })
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize)
  .populate('category instructor plan')
  .populate({
    path: 'liveSections',
    populate: [
      {
        path: 'instructor',
        model: 'Instructor'
      },
      {
        path: 'liveCourse',
        model: 'LiveCourse'
      },
      {
        path: 'assignment',
        model: 'Assignment'
      }
    ]
  })
  .populate({
    path: 'reviews',
    populate: {
      path: 'user',
      model: 'User'
    }
  });
  if (livecourses) {
    res.status(200).json({livecourses, pageCount});
  } else {
    res.status(404);
    throw new Error("Error");
  }
});



const getAllLiveCoursesOfInstructorForAdmin = asyncHandler(async (req, res) => {
  const { instructor } = req.query;
  
  const pageNumber = parseInt(req.query.pageNumber) || 1
  const pageSize = parseInt(req.query.pageSize) || 20;


  const totalCourses = await LiveCourse.countDocuments({ instructor: instructor, status: 'approved' });
  const pageCount = Math.ceil(totalCourses / pageSize);

  const livecourses = await LiveCourse.find({ instructor: instructor, status:'approved' })
  .skip((pageNumber -1) * pageSize).limit(pageSize)
  .populate('category instructor plan')
  .populate({
    path: 'liveSections',
    populate: [
      {
        path: 'instructor',
        model: 'Instructor'
      },
      {
        path: 'liveCourse',
        model: 'LiveCourse'
      },
      {
        path: 'assignment',
        model: 'Assignment'
      }
    ]
  })
  .populate({
    path: 'reviews',
    populate: {
      path: 'user',
      model: 'User'
    }
  });
  if (livecourses) {
  res.status(200).json({livecourses, pageCount})
  } else {
    res.status(404);
    throw new Error("Error");
  }
})


const searchLiveCourse = asyncHandler(async (req, res) => {
  const query = req.query.Query
  const pageNumber = Number(req.query.pageNumber) || 1
  const pageSize = 20;
 
  const searchCriteria = {
   status: 'approved',
   $or: [ {name: { $regex: query, $options: 'i' }}, {details: { $regex: query, $options: 'i' }}]
  }
  const totalCourses = await LiveCourse.countDocuments(searchCriteria)
  const pageCount = Math.ceil(totalCourses/pageSize)
  const livecourses = await LiveCourse.find(searchCriteria)
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize)
  .populate('category instructor plan')
  .populate({
    path: 'liveSections',
    populate: [
      {
        path: 'instructor',
        model: 'Instructor'
      },
      {
        path: 'liveCourse',
        model: 'LiveCourse'
      },
      {
        path: 'assignment',
        model: 'Assignment'
      }
    ]
  })
  .populate({
    path: 'reviews',
    populate: {
      path: 'user',
      model: 'User'
    }
  });
  return res.status(200).send({status: true, message: 'Search Successfull', livecourses,  pageCount})
})


const searchPendingLiveCourse = asyncHandler(async (req, res) => {
  const query = req.query.Query
  const pageNumber = Number(req.query.pageNumber) || 1
  const pageSize = 20;
 
  const searchCriteria = {
   status: 'pending',
   $or: [ {name: { $regex: query, $options: 'i' }}, {details: { $regex: query, $options: 'i' }}]
  }
  const totalCourses = await LiveCourse.countDocuments(searchCriteria)
  const pageCount = Math.ceil(totalCourses/pageSize)
  const livecourses = await LiveCourse.find(searchCriteria)
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize)
  .populate('category instructor plan')
  .populate({
    path: 'liveSections',
    populate: [
      {
        path: 'instructor',
        model: 'Instructor'
      },
      {
        path: 'liveCourse',
        model: 'LiveCourse'
      },
      {
        path: 'assignment',
        model: 'Assignment'
      }
    ]
  })
  .populate({
    path: 'reviews',
    populate: {
      path: 'user',
      model: 'User'
    }
  });
  return res.status(200).send({status: true, message: 'Search Successfull', livecourses,  pageCount})
})


const searchLiveCoursesWithinInstructor = asyncHandler(async (req, res) => {
 
  const query = req.query.Query;
  const instructor = req.query.instructor
  const pageNumber = Number(req.query.pageNumber) || 1;
  const pageSize = Number(req.query.pageSize) || 1

  

  const searchCriteria = {
    instructor: instructor,
    status: 'approved',
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { details: { $regex: query, $options: 'i' } }
    ]
  }

  const totalCourses = await LiveCourse.countDocuments(searchCriteria)
  const pageCount = Math.ceil(totalCourses/pageSize)

  const livecourses = await LiveCourse.find(searchCriteria)
  .skip((pageNumber - 1) * pageSize)
  .limit(pageSize)
  .populate('liveSections')
  .populate('plan')
  .populate('instructor')
  .populate('category')
  .populate({
    path: 'reviews',
    model: 'Review',
    populate: {
      path: 'user',
      model: 'User'
    }
  })
  res.status(200).send({ livecourses, pageCount })
  
})

const deleteLiveCourse = asyncHandler(async (req, res) => {
 
  const { id } = req.query;
  const {instructor} = req.query

  const liveCourse = await LiveCourse.findById(id);

  if (!liveCourse) {
    res.status(404);
    throw new Error("Live course not found");
  }


  if (liveCourse.instructor.toString() !== instructor?.toString()) {
    return res.status(400).send({ status: false, message: 'Instructor not authorized to delete this course' })
  }
  if (liveCourse.liveSections.length !== 0) {
    res.status(400).json({ message: "Delete all sections first" });
  } else {
    await LiveCourse.deleteOne({ _id: id });

    await Instructor.findByIdAndUpdate(instructor, {
      $pull: { livecourses: liveCourse._id }
    }, {new: true})
  
    if(liveCourse.plan.length > 0) {
      for(const p of liveCourse.plan) {
        await Plan.findByIdAndUpdate(p, {
          $pull: { liveCourses: liveCourse._id }
        })
      }
    }
    res.json({ message: "Live course deleted" });
  }
});

const deleteAllLiveCourses = asyncHandler(async (req, res) => {
  // const result = await LiveCourse.deleteMany({})
  //                await LiveSection.deleteMany({})
  res.status(200).send('Result')
})

const updateLiveCourse = asyncHandler(async (req, res) => {
  const id = req.params.id // image pending
  let {
    name,
    category,
    details,
    price,
    discount,
    description,
    batchSize,
    requirement,
    startDate,
    endDate,
    liveSections,
    instructor,
    plan,
    image
  } = req.body;
  
  const liveCourse = await LiveCourse.findById(id);

  if (!liveCourse) {
    res.status(404);
    throw new Error("Live course not found");
  }
  
  if (liveCourse.instructor.toString() !== instructor?.toString()) {
    return res.status(400).send({ status: false, message: 'Instructor not authorized to update this course' })
  }
  liveCourse.name = name || liveCourse.name;
  liveCourse.category = category || liveCourse.category;
  liveCourse.details = details || liveCourse.details;
  liveCourse.price = price || liveCourse.price;
  liveCourse.discount = discount || liveCourse.discount;
  liveCourse.description = description || liveCourse.description;
  liveCourse.batchSize = batchSize || liveCourse.batchSize;
  liveCourse.requirement = requirement || liveCourse.requirement;
  liveCourse.startDate = startDate || liveCourse.startDate;
  liveCourse.endDate = endDate || liveCourse.endDate;
  liveCourse.liveSections = liveSections || liveCourse.liveSections;
  liveCourse.instructor = instructor || liveCourse.instructor
  liveCourse.image = image || liveCourse.image

  let newPlans
  if(plan) {

      const coursePlan = await Plan.findById(plan)
      const allPlans = await Plan.find({ level: { $gte: coursePlan.level  }})
    
      newPlans = allPlans.map(plan => plan._id)
   }
   
  const updatedLiveCourse = await liveCourse.save();
  if(newPlans) {
    for(const p of newPlans) {
      await Plan.findByIdAndUpdate(p, {
        $addToSet: { liveCourses: liveCourse._id }
      })
    }
  }
  

  res.json(updatedLiveCourse);
});

const getLiveCoursesByInstructor = asyncHandler(async (req, res) => {
  const { instructor, pageNumber = 1, pageSize = 20 } = req.query

  const courses = await LiveCourse.find({instructor, status: 'approved'}).populate('category instructor plan')
  .populate({
    path: 'liveSections',
    populate: [
      {
        path: 'instructor',
        model: 'Instructor'
      },
      {
        path: 'liveCourse',
        model: 'LiveCourse'
      },
      {
        path: 'assignment',
        model: 'Assignment'
      }
    ]
  })
  .populate({
    path: 'reviews',
    populate: {
      path: 'user',
      model: 'User'
    }
  }).skip((pageNumber - 1) * pageSize).limit(pageSize);

  if(!courses || courses.length === 0) {
    return res.status(400).send({status: true, message: "Courses not exist"})
  }

  //  const totalDocuments = await LiveCourse.countDocuments({instructor, status: 'approved'})
  //  const pageCount = Math.ceil(totalDocuments/pageSize)
   

   res.status(200).send(courses)
})


const getLiveCoursesByInstructorForInstructorPanel = asyncHandler(async (req, res) => {
  const { instructor, pageNumber = 1, pageSize = 20 } = req.query

  const courses = await LiveCourse.find({instructor, status: 'approved'}).populate('category instructor plan')
  .populate({
    path: 'liveSections',
    populate: [
      {
        path: 'instructor',
        model: 'Instructor'
      },
      {
        path: 'liveCourse',
        model: 'LiveCourse'
      },
      {
        path: 'assignment',
        model: 'Assignment'
      }
    ]
  })
  .populate({
    path: 'reviews',
    populate: {
      path: 'user',
      model: 'User'
    }
  }).skip((pageNumber - 1) * pageSize).limit(pageSize);

  if(!courses || courses.length === 0) {
    return res.status(400).send({status: true, message: "Courses not exist"})
  }

   const totalDocuments = await LiveCourse.countDocuments({instructor, status: 'approved'})
   const pageCount = Math.ceil(totalDocuments/pageSize)
   

   res.status(200).send({courses, pageCount})
})

module.exports = {
  createLiveCourse,
  getLiveCourses,
  searchLiveCourse,
  getAllLiveCoursesForAdmin,
  getLiveCoursesByCategory,
  updateLiveCourse,
  deleteLiveCourse,
  getLiveCoursesByInstructor,
  deleteAllLiveCourses,
  getLiveCourseById,
  getAllPendingLiveCoursesForAdmin,
  getAllLiveCoursesOfInstructorForAdmin,
  searchLiveCoursesWithinInstructor,
  searchPendingLiveCourse,
  getLiveCoursesByInstructorForInstructorPanel
};
