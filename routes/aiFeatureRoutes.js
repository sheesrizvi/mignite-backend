const express = require('express');
const {
  addFeaturePlans,
  updateFeaturePlan,
  getAllFeaturePlans,
  getFeaturePlanById,
  deleteFeaturePlan,
} = require('../controller/aiFeatureController.js');

const router = express.Router();

router.post('/feature-plans', addFeaturePlans);
router.post('/feature-plans/update', updateFeaturePlan);
router.get('/feature-plans', getAllFeaturePlans);
router.get('/feature-plans/get-by-id', getFeaturePlanById);
router.delete('/feature-plans/delete', deleteFeaturePlan);

module.exports = router;
