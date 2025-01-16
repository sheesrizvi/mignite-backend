const express = require('express');
const { createSubscription, editSubscription, getAllSubscriptions, getSpecificSubscription, deleteSubscription, getActiveSubscriptionsOfUser } = require('../controller/subscriptionController');
const { isUser } = require("../middleware/authMiddleware");
const router = express.Router()


router.post('/create', isUser, createSubscription)
router.patch('/update' , isUser,  editSubscription)
router.get('/get-all', getAllSubscriptions)
router.get('/get-specific', getSpecificSubscription)
router.delete('/delete', isUser, deleteSubscription)
router.get('/get-all-active-subscriptions-of-user', getActiveSubscriptionsOfUser)

module.exports = router;
