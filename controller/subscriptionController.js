const mongoose = require('mongoose')
const { Subscription } = require('../models/subscriptionModel')
const asyncHandler = require('express-async-handler')
const User = require("../models/userModel")
const { Plan } = require('../models/planModel')

const createSubscription = asyncHandler(async (req, res) => {
    let { planId, duration, startDate, totalPrice, userId, paymentStatus, paymentMethod, discount, invoiceId } = req.body;
  
    const user = await User.findById(userId);
  
    if (!user) {
      return res.status(400).send({ status: false, message: 'User does not exist' });
    }
  
    let plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(400).json({ status: false, message: 'Plan not found' });
    }
    const existingSubscription = await Subscription.find({user: userId, status: "active"})
    
    if(existingSubscription.length > 0) {
        return res.status(400).send({message: 'Subscription already exist', existingSubscription})
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
      invoiceId
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
    const subscriptions = await Subscription.find()
      .populate('user')
      .populate({
        path: 'plan',
        model: 'Plan'
      })
      
  
    res.status(200).json({ status: true, subscriptions });
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
      console.error('Error updating subscriptions:', error);
    }
   
})

const getActiveSubscriptionsOfUser = asyncHandler(async (req, res) => {
  const { user } = req.query

  const subscriptions = await Subscription.find({ user, status: 'active' })

  if(!subscriptions || subscriptions.length === 0) {
    return res.status(400).send({ message: 'No Active Subscriptions found for user' })
  }

  res.status(200).send({ subscriptions })
})

module.exports = {
    getAllSubscriptions,
    getSpecificSubscription,
    deleteSubscription,
    createSubscription,
    editSubscription,
    getSubscriptionByUser,
    checkAndUpdateSubscriptions,
    getActiveSubscriptionsOfUser
}