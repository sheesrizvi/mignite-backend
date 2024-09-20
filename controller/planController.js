const asyncHandler = require('express-async-handler')
const { Plan } = require('../models/planModel')
const LiveCourse = require('../models/liveCourseModel')
const { Subscription } = require("../models/subscriptionModel")
const Course = require('../models/coursesModel')

const createPlan = asyncHandler(async (req, res) => {
  const { name, price, durationInMonths, discount, features, courses } = req.body
  if (!name || !price || !durationInMonths) {

    return res.status(400).send({ status: true, message: 'All Fields are req' })
  }
  let courseIds
  let liveCourseIds
  if(courses && courses.length > 0) {
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
    courses: courseIds,
    liveCourses: liveCourseIds
  })

  if (!newPlan) { return res.status(400).send({ status: true, message: 'Unable to crete new Plan' }) }
  
  if ((newPlan.courses && newPlan.courses.length > 0) || (newPlan.liveCourses && newPlan.liveCourses.length > 0)) {

    if (newPlan.courses.length > 0) {
      await Promise.all(newPlan.courses.map(async (courseId) => {
        await Course.findByIdAndUpdate(courseId, {
          $push: { plan: newPlan._id }
        }, { new: true });
      }));
    }
  
    if (newPlan.liveCourses.length > 0) {
      await Promise.all(newPlan.liveCourses.map(async (liveCourseId) => {
        await LiveCourse.findByIdAndUpdate(liveCourseId, {
          $push: { plan: newPlan._id }
        }, { new: true });
      }));
    }
  
    res.status(200).send({ status: true, message: 'Plan created and courses updated successfully', plan: newPlan });
  } else {
    res.status(200).send({ status: true, message: 'Plan created successfully, but no courses to update', plan: newPlan });
  }

  res.status(201).send({ status: true, message: 'New Plan created successfully', plan: newPlan })
})

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
  const { name, price, durationInMonths, discount, features, courses } = req.body;

  if (!planId) {
    return res.status(400).send({ status: false, message: 'Plan id is required' });
  }

  const planToUpdate = await Plan.findById(planId);
  if (!planToUpdate) {
    return res.status(400).send({ status: false, message: 'Plan not found' });
  }

  planToUpdate.name = name || planToUpdate.name;
  planToUpdate.price = price || planToUpdate.price;
  planToUpdate.durationInMonths = durationInMonths || planToUpdate.durationInMonths;
  planToUpdate.discount = discount || planToUpdate.discount;
  planToUpdate.features = [...new Set([...planToUpdate.features || [], ...(features || [])])];

  const coursesFromCourseModel = await Course.find({ _id: { $in: courses } });
  const coursesFromLiveCourseModel = await LiveCourse.find({ _id: { $in: courses } });

  const courseIds = coursesFromCourseModel.map((doc) => doc._id);
  const liveCourseIds = coursesFromLiveCourseModel.map((doc) => doc._id);

  planToUpdate.courses = [...new Set([...planToUpdate.courses || [], ...courseIds])];
  planToUpdate.liveCourses = [...new Set([...planToUpdate.liveCourses || [], ...liveCourseIds])];

  await planToUpdate.save();
  
  if (courseIds.length > 0) {
    await Promise.all(courseIds.map(async (courseId) => {
      await Course.findByIdAndUpdate(courseId, {
        $addToSet: { plan: planToUpdate._id } 
      });
    }));
  }


  if (liveCourseIds.length > 0) {
    await Promise.all(liveCourseIds.map(async (liveCourseId) => {
      await LiveCourse.findByIdAndUpdate(liveCourseId, {
        $addToSet: { plan: planToUpdate._id } 
      });
    }));
  }

  return res.status(200).send({ status: true, message: 'Plan updated successfully', planToUpdate });
});

const getAllPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({}).populate('courses').populate('liveCourses')
  if (plans.length === 0) {
    return res.status(400).send({ status: false, message: 'No plans found' })
  }
  res.status(200).send({ status: true, message: 'Your Plans', plans })
})

const getSpecificPlan = asyncHandler(async (req, res) => {
  const { name, planId } = req.query
  if (!name && !planId) {
    return res.status(400).send({ message: "Please provide either a name or planId" });
  }
  let query = {};
  if (name) {
    query.name = name;
  } else if (planId) {
    query._id = planId;
  }
  const plan = await Plan.findOne(query).populate('courses').populate('liveCourses')
  if (!plan) {
    return res.status(400).send({ status: false, message: 'Plan not found' })
  }
  res.status(200).send({ status: true, message: 'Your plan', plan })

})


module.exports = {
  createPlan,
  deletePlan,
  updatePlan,
  getAllPlans,
  getSpecificPlan
}