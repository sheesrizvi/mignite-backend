const mongoose = require('mongoose')
const { Subscription } = require('../models/subscriptionModel')
const asyncHandler = require('express-async-handler')
const User = require("../models/userModel")
const { Plan } = require('../models/planModel')

const createSubscription = asyncHandler(async (req, res) => {
   
    let { planId, duration, startDate, totalPriceFromClient, userId } = req.body;

    const user = await User.findById(userId)
    if(!user) {
        return res.status(400).send({status: false, message: 'User not exist '})
    }
    let plan = await Plan.findById(planId);
    if (!plan) {
        return res.status(400).json({ status: true, message: 'Plan not found' });
    }
    if(!userId || !planId || !duration || !startDate || !totalPriceFromClient) {
        return res.status(400).json({status: false, message: 'Mandatory Fields are required'})
    }

   
    let endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration);
   
   
    let subscription = new Subscription({
        user: userId,
        plan: planId,
        duration,
        startDate,
        endDate,
        totalPrice: totalPriceFromClient,
    });
    await subscription.save();
    const subscriptionId = subscription._id;
    await User.findByIdAndUpdate(userId, { $push: { subscriptions: subscriptionId } });

    res.status(201).json(subscription);
})



const editSubscription = asyncHandler(async (req, res) => {
   
    const { subscriptionId, planId, duration, autoRenew, totalPrice, status, userId } = req.body;
    console.log(userId)
    const existingSubscription = await Subscription.findOne({user: userId, _id: subscriptionId})
    if (!existingSubscription) {
      return res.status(400).json({ status: false, message: 'Subscription not found' });
    }
   
    if(existingSubscription.plan.toString() !== planId.toString() && duration && totalPrice)  {
        let newPlan = null;
        if (planId) {
          newPlan = await Plan.findById(planId);
          if (!newPlan) {
            return res.status(400).json({ status: false, message: 'Plan not found' });
          }
        }
        const updateData = {};
        let endDate = new Date();        
        endDate.setMonth(endDate.getMonth() + duration)

        updateData.startDate = new Date()
        updateData.endDate = endDate
        updateData.duration = duration
        updateData.autoRenew = autoRenew
        updateData.totalPrice = totalPrice
        updateData.plan = planId
        updateData.user = userId
        updateData.status = status || existingSubscription.status
        const newSubscription= await Subscription.findOneAndUpdate({user: userId, _id: subscriptionId}, updateData, {new: true})
        return res.status(200).send({status: true, message: 'Subscription updated successfully', 'newSubscription': newSubscription})
    } 
    else if(existingSubscription.plan.toString() === planId.toString() && duration && totalPrice) {
       
        let endDate = existingSubscription.endDate;        
        endDate.setMonth(endDate.getMonth() + duration)
       
        existingSubscription.startDate = existingSubscription.startDate
        existingSubscription.user = existingSubscription.user
        existingSubscription.plan = existingSubscription.plan
        existingSubscription.duration = existingSubscription.duration + duration
        existingSubscription.totalPrice = totalPrice  
        existingSubscription.endDate = endDate
        existingSubscription.autoRenew = autoRenew || existingSubscription.autoRenew
        existingSubscription.status = status || existingSubscription.status
        const newSubscription= await Subscription.findOneAndUpdate({user: userId, _id: subscriptionId}, existingSubscription, {new: true})
        return res.status(200).send({status: true, message: 'Subscription updated successfully', 'newerSubscription': newSubscription})
    } else {
        existingSubscription.startDate = existingSubscription.startDate 
        existingSubscription.user = existingSubscription.user
        existingSubscription.plan = existingSubscription.plan
        existingSubscription.duration = existingSubscription.duration
        existingSubscription.totalPrice = existingSubscription.totalPrice  
        existingSubscription.endDate = existingSubscription.endDate
        existingSubscription.autoRenew = autoRenew || existingSubscription.autoRenew
        existingSubscription.status = status || existingSubscription.status
        await existingSubscription.save()
        return res.status(200).send({status: true, message: 'Subscription updated successfully', 'updatedexistedSubscription': existingSubscription})
    }
   
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

        await User.findByIdAndUpdate(userId, { $pull: { subscriptions: subscription._id } });

        res.status(200).json({ message: "Subscription deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting subscription", error: err.message });
    }
});


const getAllSubscriptions = asyncHandler(async (req, res) => {
    try {
        const subscriptions = await Subscription.find().populate('user plan');
        res.status(200).json(subscriptions);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving subscriptions", error: err.message });
    }
});

const getSpecificSubscription = asyncHandler(async (req, res) => {
    const { planId, id } = req.query;

    try {
        let subscription;
        if (id) {
            subscription = await Subscription.findById(id).populate('user plan');
        } else if (planId) {
            subscription = await Subscription.find({ plan: planId }).populate('user plan');
        }

        if (!subscription || subscription.length === 0) {
            return res.status(404).json({ message: "Subscription not found" });
        }

        res.status(200).json(subscription);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving subscription", error: err.message });
    }
});


module.exports = {
    getAllSubscriptions,
    getSpecificSubscription,
    deleteSubscription,
    createSubscription,
    editSubscription
}