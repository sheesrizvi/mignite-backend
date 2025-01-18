const AiFeaturePlan = require('../models/aiFeatureModel.js'); 
const { Plan } = require('../models/planModel.js'); 
const asyncHandler = require('express-async-handler')

const addFeaturePlans = asyncHandler(async (req, res) => {
  try {
    const { planId, feature } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const higherLevelPlans = await Plan.find({ level: { $gte: plan.level } }).select('_id');

    const planIds = [...higherLevelPlans.map(p => p._id)];

    const existingFeaturePlan = await AiFeaturePlan.findOne({ feature });
    if (existingFeaturePlan) {
      return res.status(400).json({
        message: 'This feature already exists. Please update the existing feature plan.',
        existingFeaturePlan,
      });
    }

    if (existingFeaturePlan) {
      return res.status(400).json({
        message: 'This feature already exists for one or more of the selected plans.',
        existingFeaturePlan,
      });
    }

    const featurePlan = new AiFeaturePlan({
      feature,
      plans: planIds,
    });

    await featurePlan.save();

    res.status(200).json({ message: 'Feature plans added successfully', featurePlan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


const updateFeaturePlan = asyncHandler(async (req, res) => {
    try {
      
      const {id,  planId, feature } = req.body;
  
      const plan = await Plan.findById(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
  
      const higherLevelPlans = await Plan.find({ level: { $gte: plan.level } }).select('_id');
      const planIds = [...higherLevelPlans.map(p => p._id)];
  
      const updatedFeaturePlan = await AiFeaturePlan.findByIdAndUpdate(
        id,
        { feature, plans: planIds },
        { new: true, runValidators: true }
      );
  
      if (!updatedFeaturePlan) {
        return res.status(404).json({ message: 'Feature plan not found' });
      }
  
      res.status(200).json({ message: 'Feature plan updated successfully', updatedFeaturePlan });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  

  const getAllFeaturePlans = asyncHandler(async (req, res) => {
    try {
      const featurePlans = await AiFeaturePlan.find().populate('plans');
      res.status(200).json({ featurePlans });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  
  const getFeaturePlanById = asyncHandler(async (req, res) => {
    try {
      const { id } = req.query;
      const featurePlan = await AiFeaturePlan.findById(id).populate('plans');
  
      if (!featurePlan) {
        return res.status(404).json({ message: 'Feature plan not found' });
      }
  
      res.status(200).json({ featurePlan });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  
  const deleteFeaturePlan = asyncHandler(async (req, res) => {
    try {
      const { id } = req.query;
  
      const deletedFeaturePlan = await AiFeaturePlan.findByIdAndDelete(id);
  
      if (!deletedFeaturePlan) {
        return res.status(404).json({ message: 'Feature plan not found' });
      }
  
      res.status(200).json({ message: 'Feature plan deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
  

module.exports = { addFeaturePlans, updateFeaturePlan, getAllFeaturePlans, getFeaturePlanById, deleteFeaturePlan };

