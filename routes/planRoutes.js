const express = require('express');
const { createPlan, updatePlan, deletePlan, getAllPlans, getSpecificPlan } = require('../controller/planController');
const { admin, isAdminorInstructor } = require('../middleware/authMiddleware');
const router = express.Router()



router.post('/create', isAdminorInstructor, createPlan)
router.patch('/update/:planId', admin, updatePlan)
router.delete('/delete/:planId', admin, deletePlan)
router.get('/get-all', getAllPlans)
router.get('/get-specific', getSpecificPlan)

module.exports = router;
