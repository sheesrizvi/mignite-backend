const mongoose = require('mongoose')
const { Subscription } = require('../models/subscriptionModel')
const asyncHandler = require('express-async-handler')
const User = require("../models/userModel")
const { Plan } = require('../models/planModel')

const createSubscription = asyncHandler(async (req, res) => {
    let { planId, duration, startDate, totalPrice, userId, paymentStatus, paymentMethod, discount } = req.body;
  
    const user = await User.findById(userId);
  
    if (!user) {
      return res.status(400).send({ status: false, message: 'User does not exist' });
    }
  
    let plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(400).json({ status: false, message: 'Plan not found' });
    }
  
    const allPlans = await Plan.find({ level: { $gte: plan.level } });
    const allPlanIds = allPlans.map(plan => plan._id);
  
    let endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration);
  
    let subscription = new Subscription({
      user: userId,
      plan: allPlanIds,
      startDate,
      endDate,
      duration,
      paymentStatus,
      paymentMethod,
      totalPrice,
      discount,
    });
  
    let coursesInsidePlan = new Set();
    let liveCoursesInsidePlan = new Set();
  
    for (const p of allPlanIds) {
      const plan = await Plan.findById(p);
      plan.courses.forEach(course => coursesInsidePlan.add(course.toString()));
      plan.liveCourses.forEach(liveCourse => liveCoursesInsidePlan.add(liveCourse.toString()));
    }
  
    coursesInsidePlan = Array.from(coursesInsidePlan);
    liveCoursesInsidePlan = Array.from(liveCoursesInsidePlan);
  
    subscription.coursesAssigned = coursesInsidePlan;
    subscription.liveCoursesAssigned = liveCoursesInsidePlan;
  
    await subscription.save();
    const subscriptionId = subscription._id;
  
    let subscribedCourses = [];
  
    for (const courseId of coursesInsidePlan) {
      const existingCourse = await User.findOne({
        _id: userId,
        'subscribedCourses.course': courseId,
        'subscribedCourses.courseType': 'Course',
      });
  
      if (!existingCourse) {
        subscribedCourses.push({
          course: courseId,
          courseType: 'Course',
          subscriptionId: subscriptionId,
          startedAt: subscription.startDate,
          expiresAt: subscription.endDate,
          status: 'Enrolled',
        });
      }
    }
  
    for (const liveCourseId of liveCoursesInsidePlan) {
      const existingLiveCourse = await User.findOne({
        _id: userId,
        'subscribedCourses.course': liveCourseId,
        'subscribedCourses.courseType': 'LiveCourse',
      });
  
      if (!existingLiveCourse) {
        subscribedCourses.push({
          course: liveCourseId,
          courseType: 'LiveCourse',
          subscriptionId: subscriptionId,
          startedAt: subscription.startDate,
          expiresAt: subscription.endDate,
          status: 'Enrolled',
        });
      }
    }
  
    if (subscribedCourses.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $push: { subscriptions: subscriptionId },
        $addToSet: { subscribedCourses: { $each: subscribedCourses } },
      });
    }
  
    res.status(201).json({ status: true, message: 'Subscription created Successfully', subscription });
  });
  
const editSubscription = asyncHandler(async (req, res) => {
    const { 
      subscriptionId, planId, duration, startDate, totalPrice, userId, 
      paymentStatus, paymentMethod, discount, autoRenew, status 
    } = req.body;
  
    if (!userId) {
      return res.status(400).json({ status: false, message: 'User ID is required' });
    }
  
    const existingSubscription = await Subscription.findOne({ user: userId, _id: subscriptionId });
    
    if (!existingSubscription) {
      return res.status(400).json({ status: false, message: 'Subscription not found' });
    }
  
    if (planId && startDate && duration && totalPrice && paymentStatus && paymentMethod) {
      let plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(400).json({ status: false, message: 'Plan not found' });
      }
  
      const allPlans = await Plan.find({ level: { $gte: plan.level } });
      const allPlanIds = allPlans.map(plan => plan._id);
  
      let endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + duration);
  
      let coursesInsidePlan = new Set();
      let liveCoursesInsidePlan = new Set();
  
      for (const p of allPlanIds) {
        const plan = await Plan.findById(p);
        plan.courses.forEach(course => coursesInsidePlan.add(course.toString()));
        plan.liveCourses.forEach(liveCourse => liveCoursesInsidePlan.add(liveCourse.toString()));
      }
  
      coursesInsidePlan = Array.from(coursesInsidePlan);
      liveCoursesInsidePlan = Array.from(liveCoursesInsidePlan);
  
      existingSubscription.plan = allPlanIds;
      existingSubscription.startDate = new Date(startDate);
      existingSubscription.endDate = endDate;
      existingSubscription.duration = duration;
      existingSubscription.totalPrice = totalPrice;
      existingSubscription.paymentStatus = paymentStatus;
      existingSubscription.paymentMethod = paymentMethod;
      existingSubscription.discount = discount || existingSubscription.discount;
      existingSubscription.coursesAssigned = coursesInsidePlan;
      existingSubscription.liveCoursesAssigned = liveCoursesInsidePlan;
  
      await existingSubscription.save();
  
        let subscribedCourses = [];

        for (const courseId of coursesInsidePlan) {
        const existingCourse = await User.findOne({
            _id: userId,
            'subscribedCourses.course': courseId,
            'subscribedCourses.courseType': 'Course'
        });

        if (!existingCourse) {
            subscribedCourses.push({
            course: courseId,
            courseType: 'Course',
            subscriptionId: subscriptionId,
            startedAt: existingSubscription.startDate,
            expiresAt: existingSubscription.endDate,
            status: 'Enrolled',
            });
        }
        }


        for (const courseId of liveCoursesInsidePlan) {

        const existingCourse = await User.findOne({
            _id: userId,
            'subscribedCourses.course': courseId,
            'subscribedCourses.courseType': 'LiveCourse'
        });


        if (!existingCourse) {
            subscribedCourses.push({
            course: courseId,
            courseType: 'LiveCourse',
            subscriptionId: subscriptionId,
            startedAt: existingSubscription.startDate,
            expiresAt: existingSubscription.endDate,
            status: 'Enrolled',
            });
        }
        }


        if (subscribedCourses.length > 0) {
        await User.findByIdAndUpdate(userId, {
            $addToSet: { subscribedCourses: { $each: subscribedCourses } },
        });
        }


      return res.status(200).json({
        status: true,
        message: 'Subscription updated successfully with new plan',
        subscription: existingSubscription,
      });
    }
  
    if (!planId && !totalPrice && (autoRenew !== undefined || status)) {
      existingSubscription.autoRenew = autoRenew !== undefined ? autoRenew : existingSubscription.autoRenew;
      existingSubscription.status = status || existingSubscription.status;
      existingSubscription.paymentStatus = paymentStatus || existingSubscription.paymentStatus;
      existingSubscription.paymentMethod = paymentMethod || existingSubscription.paymentMethod;
      existingSubscription.discount = discount || existingSubscription.discount;
  
      await existingSubscription.save();
  
      return res.status(200).json({
        status: true,
        message: 'Subscription updated successfully',
        subscription: existingSubscription,
      });
    }
  
    return res.status(400).json({ status: false, message: 'Required fields for update are missing' });
  });
  


const deleteSubscription = asyncHandler(async (req, res) => {
   
    const { userId , id} = req.body
    try {
        const subscription = await Subscription.findOne({user: userId, _id: id})
        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found" });
        }
        
        if (subscription.status === "active") {
            return res.status(400).json({ message: "Subscription is active, No need to delete." });
        }

        await Subscription.findByIdAndDelete(id);

        await User.findByIdAndUpdate(userId, { $pull:
        { 
            subscriptions: subscription._id ,
            subscribedCourses: { subscriptionId: subscription._id }
        } });
        
        res.status(200).json({ message: "Subscription deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting subscription", error: err.message });
    }
});


const getAllSubscriptions = async (req, res) => {
    const subscriptions = await Subscription.find()
      .populate('user')
      .populate({
        path: 'plan',
        model: 'Plan'
      })
      .populate({
        path: 'coursesAssigned',
        populate: [{
          path: 'instructor',
          model: 'Instructor'
        }, {
          path: 'sections',
          model: 'Section'
        }]
      })
      .populate({
        path: 'liveCoursesAssigned',
        populate: [{
          path: 'instructor',
          model: 'Instructor'
        }, {
          path: 'liveSections',
          model: 'LiveSection'
        }]
      });
  
    res.status(200).json({ status: true, subscriptions });
  };
  


const getSpecificSubscription = asyncHandler(async (req, res) => {
    const { id } = req.query;

    const subscription = await Subscription.findById(id)
        .populate('user')
        .populate('plan')
        .populate({
            path: 'coursesAssigned',
            populate: [{
                path: 'instructor',
                model: 'Instructor'
            }, {
                path: 'sections',
                model: 'Section'
            }]
        })
        .populate({
            path: 'liveCoursesAssigned',
            populate: [{
                path: 'instructor',
                model: 'Instructor'
            }, {
                path: 'liveSections',
                model: 'LiveSection'
            }]
        });

    if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json({status: true, subscription});
});



module.exports = {
    getAllSubscriptions,
    getSpecificSubscription,
    deleteSubscription,
    createSubscription,
    editSubscription
}