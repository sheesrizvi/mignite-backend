const mongoose = require('mongoose')
const { Subscription } = require('../models/subscriptionModel')
const asyncHandler = require('express-async-handler')
const User = require("../models/userModel")
const { Plan } = require('../models/planModel')
const Course = require("../models/coursesModel");
const LiveCourse = require("../models/liveCourseModel");
const { getAccessToken, validateAndCapturePaypalOrder } = require('../middleware/paypalMiddleware.js')
const axios = require('axios')

const createSubscription = asyncHandler(async (req, res) => {
    let { planId, duration, startDate, totalPrice, userId, paymentStatus, paymentMethod, discount, invoiceId, token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "PayPal token is required." });
    }

    const { paypalOrderId, paypalCaptureId } = await validateAndCapturePaypalOrder(token)

    const user = await User.findById(userId);
  
    if (!user) {
      return res.status(400).send({ status: false, message: 'User does not exist' });
    }
  
    let plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(400).json({ status: false, message: 'Plan not found' });
    }
    const existingSubscription = await Subscription.find({user: userId, status: "active"})
    
    if(existingSubscription && existingSubscription.length > 0) {
        return res.status(400).send({message: 'User has already subscribed to existing plan', existingSubscription})
    }
    
    let endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration);
  
    let subscription = new Subscription({
      user: userId,
      plan: planId,
      startDate,
      endDate,
      duration,
      paymentStatus,
      paymentMethod,
      totalPrice,
      discount,
      invoiceId,
      paypalOrderId,
      paypalCaptureId
    });
  
    
    await subscription.save();
    subscription = await Subscription.findById(subscription._id).populate('user').populate('plan')
    res.status(201).json({ status: true, message: 'Subscription created Successfully', subscription });
  });
  
const editSubscription = asyncHandler(async (req, res) => {
    const { 
      subscriptionId, planId, duration, startDate, totalPrice, userId, 
      paymentStatus, paymentMethod, discount, autoRenew, status , invoiceId
    } = req.body;
  
    if (!userId) {
      return res.status(400).json({ status: false, message: 'User ID is required' });
    }
  
    const existingSubscription = await Subscription.findOne({ user: userId, _id: subscriptionId, status: 'active' }).populate('plan');
    
    if (!existingSubscription) {
      return res.status(400).json({ status: false, message: 'Subscription not found' });
    }
    
    

    if (planId && startDate && duration && totalPrice && paymentStatus && paymentMethod) {
      let plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(400).json({ status: false, message: 'Plan not found' });
      }
  
      if(existingSubscription.plan._id.toString() === planId.toString()) {
        return res.status(400).send({status: false, message: 'Subscription with this Plan already exist'})
    }

     if(plan.level > existingSubscription.plan.level) {
        return res.status(400).send({status: false, message: 'Plan level below current active plan'})
     }
    
      let endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + duration);
  
      
  

  
      existingSubscription.plan = planId;
      existingSubscription.startDate = new Date(startDate);
      existingSubscription.endDate = endDate;
      existingSubscription.duration = duration;
      existingSubscription.totalPrice = totalPrice;
      existingSubscription.paymentStatus = paymentStatus;
      existingSubscription.paymentMethod = paymentMethod;
      existingSubscription.discount = discount || existingSubscription.discount;
      existingSubscription.invoiceId = invoiceId || existingSubscription.invoiceId;
      await existingSubscription.save();
  
        
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

        
        
        res.status(200).json({ message: "Subscription deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting subscription", error: err.message });
    }
});


const getAllSubscriptions = async (req, res) => {
    let { pageNumber = 1, pageSize = 20 } = req.query
    console.log('running')
    const subscriptions = await Subscription.find()
      .populate('user')
      .populate({
        path: 'plan',
        model: 'Plan'
      }).sort({ startDate: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize)
      
    const totalDocuments = await Subscription.countDocuments({})
    const pageCount = Math.ceil(totalDocuments/pageSize)
  
    res.status(200).json({ status: true, subscriptions, pageCount });
};
  
const getAllSubscriptionsForDownload = async (req, res) => {
 
  const subscriptions = await Subscription.find()
    .populate('user')
    .populate({
      path: 'plan',
      model: 'Plan'
    }).sort({ startDate: -1 })
    

  res.status(200).json({ status: true, subscriptions });
};


const searchSubscriptions = async (req, res) => {

      let { pageNumber = 1, pageSize = 20, status } = req.query;
    
      const subscriptions = await Subscription.find({ status })
          .populate("user")
          .populate({
              path: "plan",
              model: "Plan"
          })
          .sort({ startDate: -1 })
          .skip((pageNumber - 1) * pageSize)
          .limit(parseInt(pageSize));

      const totalDocuments = await Subscription.countDocuments({status});
      const pageCount = Math.ceil(totalDocuments / pageSize);
     
      res.status(200).json({ status: true, subscriptions, pageCount });
  
};

const getSpecificSubscription = asyncHandler(async (req, res) => {
    const { id } = req.query;

    const subscription = await Subscription.findById(id)
        .populate('user')
        .populate('plan')
       
    if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json({status: true, subscription});
});

const getSubscriptionByUser = asyncHandler(async (req, res) => {
    const { userId } = req.query;
  
    const subscriptions = await Subscription.find({ user: userId })
      .populate('user')
      .populate('plan');
  
    res.json(subscriptions);
  });


const checkAndUpdateSubscriptions = asyncHandler(async () => {
    const now = Date.now()
    try {
      const result = await Subscription.updateMany({
        endDate: { $lte: now },
        status: 'active'
    }, {
      status: 'inactive'
    });
      console.log(`Updated ${result.modifiedCount} expired subscriptions.`);
    } catch(e) {
      console.error('Error updating subscriptions:', e);
    }
   
})

const getActiveSubscriptionsOfUser = asyncHandler(async (req, res) => {
  const { user } = req.query

  const subscriptions = await Subscription.find({ user, status: 'active' }).populate('user')
  .populate({
    path: 'plan',
    model: 'Plan'
  })

  if(!subscriptions || subscriptions.length === 0) {
    return res.status(400).send({ message: 'No Active Subscriptions found for user' })
  }

  res.status(200).send({ subscriptions })
})


const getCoursesBySubscription = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  const subscription = await Subscription.findOne({ user: userId, status: 'active' }).populate('plan');

  if (!subscription) {
    return res.status(400).json({ message: "Subscription not found" });
  }

  const subscriptionLevel = subscription.plan.level;

  const plans = await Plan.find({ level: { $gte: subscriptionLevel } })
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

  return res.status(200).json({
    message: "Courses fetched successfully based on subscription level",
    subscriptionLevel,
    courses,
    liveCourses
  });
});

const getUpgradeSubscriptionDetails = asyncHandler(async (req, res) => {
  const { userId, planId, duration } = req.query; // duration is optional parameter 

  const subscription = await Subscription.findOne({ user: userId, status: 'active' });
  if (!subscription) {
    throw new Error('Active subscription not found');
  }

  const now = new Date();
  const endDate = new Date(subscription.endDate);
  const startDate = new Date(subscription.startDate);

  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)), 0);

  const perDayPrice = subscription.totalPrice / totalDays;
  const unusedValue = perDayPrice * remainingDays;

  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error('Target plan not found');
  }

  const durationInMonths = duration ? parseInt(duration, 10) : plan.durationInMonths;

  const totalPlanPrice = (plan.price / plan.durationInMonths) * durationInMonths;

  const payableAmount = Math.max(totalPlanPrice - unusedValue, 0);

  const billingStartDate = new Date();
  const billingEndDate = new Date(billingStartDate);
  billingEndDate.setMonth(billingEndDate.getMonth() + durationInMonths);

  res.status(200).json({
    currentPlan: subscription.plan,
    currentPlanEndsOn: subscription.endDate,
    newPlan: planId,
    originalNewPlanPrice: totalPlanPrice,
    unusedBalanceFromCurrentPlan: unusedValue,
    finalAmountToPay: Math.round(payableAmount),
    billingStartDate,
    billingEndDate,
    durationInMonths
  });
});


const upgradeSubscription = asyncHandler(async (req, res) => {
  let { planId, duration, startDate, totalPrice, userId, paymentStatus, paymentMethod, discount, invoiceId, token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "PayPal token is required." });
  }


  const { paypalOrderId, paypalCaptureId } = await validateAndCapturePaypalOrder(token)

  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(400).send({ status: false, message: 'User does not exist' });
  }

  let plan = await Plan.findById(planId);
  if (!plan) {
    return res.status(400).json({ status: false, message: 'Plan not found' });
  }
  const existingSubscription = await Subscription.find({user: userId, status: "active"})
  
  if(existingSubscription && existingSubscription.length > 0) {
      await Subscription.updateMany({ user: userId }, { status: 'inactive' })
  }
  
  let start = new Date(startDate);

  if (isNaN(start)) {
    return res.status(400).send({ status: false, message: 'Invalid start date' });
  }

  if (isNaN(duration) || duration <= 0) {
    return res.status(400).send({ status: false, message: 'Invalid duration' });
  }

  let endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + duration);

  let subscription = new Subscription({
    user: userId,
    plan: planId,
    startDate,
    endDate,
    duration,
    paymentStatus,
    paymentMethod,
    totalPrice,
    discount,
    invoiceId,
    paypalOrderId, paypalCaptureId 
  });

  
  await subscription.save();
  subscription = await Subscription.findById(subscription._id).populate('user').populate('plan')
  res.status(201).json({ status: true, message: 'Subscription created Successfully', subscription });
})


module.exports = {
    getAllSubscriptions,
    getSpecificSubscription,
    deleteSubscription,
    createSubscription,
    editSubscription,
    getSubscriptionByUser,
    checkAndUpdateSubscriptions,
    getActiveSubscriptionsOfUser,
    searchSubscriptions,
    getAllSubscriptionsForDownload,
    getCoursesBySubscription,
    getUpgradeSubscriptionDetails,
    upgradeSubscription
}


