const mongoose = require('mongoose')
const { Subscription } = require('../models/subscriptionModel')
const asyncHandler = require('express-async-handler')
const User = require("../models/userModel")
const { Plan } = require('../models/planModel')

const createSubscription = asyncHandler(async (req, res) => {
    const userId = req.user._id
    let { planId, duration, startDate, totalPriceFromClient } = req.body;
    const user = await User.findById(userId)
    if(!user) {
        return res.status(400).send({status: false, message: 'User not exist '})
    }
    let plan = await Plan.findById(planId);
    if (!plan) {
        return res.status(400).json({ status: true, message: 'Plan not found' });
    }
    if(!userId || !planId || !duration || !startDate) {
        return res.status(400).json({status: false, message: 'Mandatory Fields are required'})
    }

    let calculatedTotalPrice = plan.price * duration;
    if (plan.discount) {
        calculatedTotalPrice -= (calculatedTotalPrice * plan.discount) / 100;
    }
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    if(calculatedTotalPrice !== totalPriceFromClient) {
        // return res.status(400).send({status: false, messge: 'Total Price not matched})
    }
    let subscription = new Subscription({
        user: userId,
        plan: planId,
        duration,
        startDate,
        endDate,
        totalPrice: calculatedTotalPrice,
    });
    await subscription.save();
    const subscriptionId = subscription._id;
    await User.findByIdAndUpdate(userId, { $push: { subscriptions: subscriptionId } });

    res.status(201).json(subscription);
})



const editSubscription = asyncHandler(async (req, res) => {
//     const { subscriptionId, planId, duration, autoRenew } = req.body;
  
//     const existingSubscription = await Subscription.findById(subscriptionId).populate('plan');
//     if (!existingSubscription) {
//       return res.status(400).json({ status: false, message: 'Subscription not found' });
//     }
  
//     let newPlan = null;
//     if (planId) {
//       newPlan = await Plan.findById(planId);
//       if (!newPlan) {
//         return res.status(400).json({ status: false, message: 'Plan not found' });
//       }
//     }
  
//     let updateData = {};
  
//     if (!planId && duration) {
//       const previousPrice = existingSubscription.totalPrice;
//       const remainingDays = Math.ceil((existingSubscription.endDate - new Date()) / (1000 * 60 * 60 * 24));
//       const previousPlanPrice = existingSubscription.plan.price;
  
//       const remainingPrice = remainingDays * (previousPlanPrice / existingSubscription.duration);
  
//       let newTotalPrice = remainingPrice;
//       if (planId) {
//         const newPlanPrice = newPlan.price;
//         const newDiscount = newPlan.discount || 0;
//         newTotalPrice += (newPlanPrice * duration) * (1 - newDiscount / 100);
//       } else {
//         newTotalPrice += (previousPlanPrice * duration) * (1 - existingSubscription.plan.discount / 100);
//       }
  
//       updateData = {
//         duration: duration,
//         endDate: new Date(existingSubscription.endDate.setDate(existingSubscription.endDate.getDate() + duration)),
//         totalPrice: newTotalPrice,
//       };
//     }
  
//     if (planId && duration) {
//       const newPlanPrice = newPlan.price;
//       const newDiscount = newPlan.discount || 0;
  
//     }
  
//     if (!planId && !duration) {
//       updateData = { autoRenew };
//     }
  
//     const updatedSubscription = await Subscription.findByIdAndUpdate(subscriptionId, updateData, { new: true });
//     res.status(200).json(updatedSubscription);
  });

const deleteSubscription = asyncHandler(async (req, res) => {
    const { id } = req.query;
    const userId = req.user._id
    try {
        //const subscription = await Subscription.findById(id);
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