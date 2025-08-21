const asyncHandler = require('express-async-handler')
const { Plan } = require('../models/planModel')
const LiveCourse = require('../models/liveCourseModel')
const { Subscription } = require("../models/subscriptionModel")
const Course = require('../models/coursesModel')

const createPlan = asyncHandler(async (req, res) => {
  const { name, price, durationInMonths, discount, features, courses, level } = req.body;

  if (!name || !price || !durationInMonths) {
    return res.status(400).send({ status: true, message: 'All Fields are required' });
  }

  // if(!courses || courses.length <= 0) {
  //   return res.status(400).send({ message: "No Course added in Plan" })
  // }

  let courseIds = [];
  let liveCourseIds = [];

  if (courses && courses?.length > 0) {
    const coursesFromCourseModel = await Course.find({ _id: { $in: courses } });
    const coursesFromLiveCourseModel = await LiveCourse.find({ _id: { $in: courses } });

    
    courseIds = coursesFromCourseModel.map((course) => course._id);
    liveCourseIds = coursesFromLiveCourseModel.map((liveCourse) => liveCourse._id);
  }

  const newPlan = await Plan.create({
    name,
    price,
    durationInMonths,
    discount,
    features,
    level,
    courses: courseIds,
    liveCourses: liveCourseIds,
  });

  if (!newPlan) {
    return res.status(400).send({ status: true, message: 'Unable to create new Plan' });
  }

  for (const courseId of courseIds) {
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { plan: newPlan._id }
    });
  }

  for (const liveCourseId of liveCourseIds) {
    await LiveCourse.findByIdAndUpdate(liveCourseId, {
      $addToSet: { plan: newPlan._id }
    });
  }

  return res.status(201).send({ status: true, message: 'New Plan created successfully', plan: newPlan });
});

const deletePlan = asyncHandler(async (req, res) => {

  const planId = req.params.planId

  if (!planId) {
    return res.status(400).send({ status: false, message: 'Plan id is required' })
  }
  const plan = await Plan.findById(planId)
  if (!plan) {
    return res.status(400).send({ status: true, message: 'Plan not found' })
  }
  const subscriptions = await Subscription.find({ plan: planId, status: 'active' });
  if (subscriptions.length > 0) {
    return res.status(400).send({ status: false, message: 'Plan has some valid subscriptions, Cannot delete it first' })
  }
  await Course.updateMany({ plan: planId}, { $pull: { plan: planId } })
  await LiveCourse.updateMany({ plan: planId }, { $pull: { plan: planId } });
  await Plan.findByIdAndDelete(planId)
  res.status(200).send({ status: true, message: 'Plan deleted successfully' })
})

const updatePlan = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  
  const { name, price, durationInMonths, discount, features, courses, level } = req.body;

  if (!planId) {
    return res.status(400).send({ status: false, message: 'Plan id is required' });
  }

  const planToUpdate = await Plan.findById(planId);
  if (!planToUpdate) {
    return res.status(400).send({ status: false, message: 'Plan not found' });
  }

  if(!courses || courses.length <= 0) {
    return res.status({ message: "No Course Included in Plans" })
  }

  planToUpdate.name = name || planToUpdate.name;
  planToUpdate.price = price || planToUpdate.price;
  planToUpdate.durationInMonths = durationInMonths || planToUpdate.durationInMonths;
  planToUpdate.discount = discount || planToUpdate.discount;
  planToUpdate.level = level || planToUpdate.level
  planToUpdate.features = [...new Set([...planToUpdate.features || [], ...(features || [])])];

  

  const coursesFromCourseModel = await Course.find({ _id: { $in: courses } });
  const coursesFromLiveCourseModel = await LiveCourse.find({ _id: { $in: courses } });

  const courseIds = coursesFromCourseModel.map((doc) => doc._id);
  const liveCourseIds = coursesFromLiveCourseModel.map((doc) => doc._id);

  planToUpdate.courses = [...new Set([...planToUpdate.courses || [], ...courseIds])];
  planToUpdate.liveCourses = [...new Set([...planToUpdate.liveCourses || [], ...liveCourseIds])];

  await planToUpdate.save();
  
  if (courseIds.length > 0) {
    for (const courseId of courseIds) {
      await Course.findByIdAndUpdate(courseId, {
        $addToSet: { plan: planToUpdate._id }
      });
    }
  }


  if (liveCourseIds.length > 0) {
    for (const liveCourseId of liveCourseIds) {
      await LiveCourse.findByIdAndUpdate(liveCourseId, {
        $addToSet: { plan: planToUpdate._id }
      });
    }
  
}


  return res.status(200).send({ status: true, message: 'Plan updated successfully', planToUpdate });
});

const getAllPlans = asyncHandler(async (req, res) => {
  const { pageNumber = 1, pageSize = 20, userId } = req.query;

  const plans = await Plan.find({})
    .populate('courses')
    .populate('liveCourses')
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  if (plans.length === 0) {
    return res.status(400).send({
      status: false,
      message: {
        en: "No plans found",
        ar: "لم يتم العثور على أي خطط"
      }
    })

  }

  const totalDocuments = await Plan.countDocuments({});
  const pageCount = Math.ceil(totalDocuments / pageSize);

  const subscriptions = await Subscription.find({ user: userId, status: 'active' }).populate('user');
  const subscribedPlanIds = subscriptions.map((subscription) => subscription.plan.toString());

  const notSubscribedPlans = plans.filter((plan) => {
    return !subscribedPlanIds.includes(plan._id.toString());
  });

  res.status(200).send({
    status: true,
    message: {
      en: "Your plans",
      ar: "خططك"
    },
    plans: notSubscribedPlans,
    pageCount,
  });
});


// const getAllPlans = asyncHandler(async (req, res) => {
//   const { pageNumber = 1, pageSize = 20, userId } = req.query;

//   const plans = await Plan.find({})
//     .populate('courses')
//     .populate('liveCourses')
//     .sort({ createdAt: -1 })
//     .skip((pageNumber - 1) * pageSize)
//     .limit(pageSize);

//   if (plans.length === 0) {
//     return res.status(400).send({ status: false, message: 'No plans found' });
//   }

//   const totalDocuments = await Plan.countDocuments({});
//   const pageCount = Math.ceil(totalDocuments / pageSize);

//   const subscriptions = await Subscription.find({ user: userId, status: 'active' }).populate('user');
//   const subscribedPlanIds = subscriptions.map((subscription) => subscription.plan.toString());

//   const plansWithSubscriptionFlag = plans.map((plan) => {
//     return {
//       ...plan.toObject(),
//       hasSubscribed: subscribedPlanIds.includes(plan._id.toString())
//     };
//   });

//   res.status(200).send({
//     status: true,
//     message: 'Your Plans',
//     plans: plansWithSubscriptionFlag,
//     pageCount,
//   });
// });


const getMyPlans = asyncHandler(async (req, res) => {

})

const getSpecificPlan = asyncHandler(async (req, res) => {
  const { name, planId } = req.query
  if (!name && !planId ) {
    return res.status(400).send({ message: "Please provide either a name or planId" });
  }
  let query = {};
  if (name) {
    query.name = name;
  } 
  if (planId) {
    query._id = planId;
  }
 
  const plan = await Plan.findOne(query).populate('courses').populate('liveCourses')
  if (!plan) {
    return res.status(400).send({ status: false, message: 'Plan not found' })
  }
  res.status(200).send({ status: true, message: 'Your plan', plan })

})

const getPlanByLevels = asyncHandler(async (req, res) => {
  const { level } = req.query
  if(!level) {
    return res.status(400).send({status: false, message: 'Level not found in query params'})
  }
  if(level) {
    const numericLevel = Number(level)
    if(!Number.isNaN(numericLevel)) {
     const plan = await Plan.find({level}).populate('courses').populate('liveCourses')
     return res.status(200).send({status: true, plan})
    } else {
      res.status(400).send({status: false, message: 'Level not a numeric value'})
    }
  }

})

const searchPlan = asyncHandler(async (req, res) => {
  const { Query: query, pageNumber = 1, pageSize = 20 } = req.query
  const plans = await Plan.find({
    $or: [
      { name: { $regex: query, $options: 'i' } }
    ]
  }).sort({createdAt: -1}).skip((pageNumber - 1) * pageSize).limit(pageSize)

  if(!plans || plans.length === 0) {
    return res.status(400).send({ message: 'No Plan found' })
  }

  const totalDocuments = await Plan.countDocuments({
    $or: [
      { name: { $regex: query, $options: 'i' } }
    ]
  })

  const pageCount = Math.ceil(totalDocuments/pageSize)
  res.status(200).send({ plans, pageCount })
})

const getCoursesByPlan = asyncHandler(async (req, res) => {
  const { planId } = req.query

  const plan = await Plan.findById(planId)
  if(!plan || !plan.level) {
    return res.status(400).send({
      message: {
        en: "Plan not found",
        ar: "الخطة غير موجودة"
      }
    })

  }
  const plans = await Plan.find({ level: { $gte: plan.level } })
    .populate('courses')
    .populate('liveCourses');

  const courseSet = new Set();
  const liveCourseSet = new Set();

  for (const plan of plans) {
    plan.courses.forEach(course => {
      if (course) courseSet.add(course._id.toString());
    });

    plan.liveCourses.forEach(liveCourse => {
      if (liveCourse) liveCourseSet.add(liveCourse._id.toString());
    });
  }

  const courses = await Course.find({ '_id': { $in: Array.from(courseSet) } });
  const liveCourses = await LiveCourse.find({ '_id': { $in: Array.from(liveCourseSet) } });
  const allCourses = [...courses, ...liveCourses]
  return res.status(200).json({
   message: {
      en: "Courses fetched successfully based on plan level",
      ar: "تم جلب الدورات التدريبية بنجاح بناءً على مستوى الخطة"
    },
    planLevel: plan.level,
    allCourses,
    courses,
    liveCourses,
  });
})


const getPlanByCourseId = asyncHandler(async (req, res) => {
  const { courseId } = req.query

  const plans = await Plan.find({ 
    $or: [
      { courses: { $in: courseId } },
      { liveCourses: { $in: courseId } }
    ]
   })

   if(!plans || plans.length === 0) {
    return res.status(400).send({ message: "No Plans found for this course" })
   }
   
   res.status(200).send({ plans })
})

module.exports = {
  createPlan,
  deletePlan,
  updatePlan,
  getAllPlans,
  getPlanByLevels,
  getSpecificPlan,
  searchPlan,
  getCoursesByPlan,
  getPlanByCourseId
}