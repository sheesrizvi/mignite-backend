const asyncHandler = require('express-async-handler')
const { Plan } = require('../models/planModel')
const LiveCourse = require('../models/liveCourseModel')
const { Subscription } = require("../models/subscriptionModel")
const createPlan = asyncHandler(async (req, res) => {
  const { name, price, durationInMonths, discount, features, courses } = req.body
  console.log(req.body)
  if (!name || !price || !durationInMonths) {

    return res.status(400).send({ status: true, message: 'All Fields are req' })
  }


  if (courses && courses.length > 0) {
    const existingCourses = await LiveCourse.find({ _id: { $in: courses } });
    if (existingCourses.length !== courses.length) {
      return res.status(400).json({ status: false, message: 'One or more courses are invalid' });
    }
  }

  const newPlan = await Plan.create({
    name,
    price,
    durationInMonths,
    discount,
    features,
    courses
  })

  if (!newPlan) { return res.status(400).send({ status: true, message: 'Unable to crete new Plan' }) }
  if (newPlan.courses && newPlan.courses.length > 0) {
    for (const courseId of newPlan.courses) {
      const liveCourse = await LiveCourse.findByIdAndUpdate(
        courseId,
        { $push: { plan: newPlan._id } },
        { new: true }
      );

      if (!liveCourse) {
        console.error(`LiveCourse with ID ${courseId} not found`);
      }
    }
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

  await LiveCourse.updateMany({ plan: planId }, { $pull: { plan: planId } });
  await Plan.findByIdAndDelete(planId)
  res.status(200).send({ status: true, message: 'Plan deleted successfully' })
})

const updatePlan = asyncHandler(async (req, res) => {
  const { planId } = req.params
  const { name, price, durationInMonhs, discount, features, courses } = req.body

  if (!planId) {
    return res.status(400).send({ status: false, message: 'Plan id is required' })
  }
  const planToUpdate = await Plan.findById(planId)

  if (!planToUpdate) {
    return res.status(400).send({ status: true, message: 'Plan not found' })
  }

  planToUpdate.name = name || planToUpdate.name
  planToUpdate.price = price || planToUpdate.price
  planToUpdate.durationInMonhs = durationInMonhs || planToUpdate.durationInMonhs
  planToUpdate.discount = discount || planToUpdate.discount
  planToUpdate.features = [...new Set([...planToUpdate.features || [], ...(features || [])])]
  planToUpdate.courses = [...new Set([...planToUpdate.courses || [], ...(courses || [])])];


  if (courses && courses.length > 0) {
    for (const courseId of courses) {
      const updatedCourse = await LiveCourse.findByIdAndUpdate(
        courseId,
        { $push: { plan: planToUpdate._id } },
        { new: true }
      );

      if (!updatedCourse) {
        res.status(200).send({ status: false, message: 'LiveCourse with this course id not found' });
      }
    }
  }

  await planToUpdate.save()


  return res.status(200).send({ status: true, message: 'Plan updates successfully', planToUpdate })

})

const getAllPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({})
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
  const plan = await Plan.findOne(query)
  if (!plan) {
    return res.status(400).send({ status: true, message: 'Plan not found' })
  }
  res.status(200).send({ status: false, message: 'Your plan', plan })

})


module.exports = {
  createPlan,
  deletePlan,
  updatePlan,
  getAllPlans,
  getSpecificPlan
}