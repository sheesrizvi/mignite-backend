const express = require('express');
const { createPlan, updatePlan, deletePlan, getAllPlans, getSpecificPlan, getPlanByLevels, searchPlan, getCoursesByPlan } = require('../controller/planController');
const { admin, isAdminorInstructor } = require('../middleware/authMiddleware');
const router = express.Router()



router.post('/create', isAdminorInstructor , createPlan)
router.patch('/update/:planId', admin, updatePlan)
router.delete('/delete/:planId', admin, deletePlan)
router.get('/get-all', getAllPlans)
router.get('/get-specific', getSpecificPlan)
router.get('/get-by-level', getPlanByLevels)
router.get('/search-plan', searchPlan)
router.get('/get-courses-by-plan', getCoursesByPlan)

module.exports = router;
