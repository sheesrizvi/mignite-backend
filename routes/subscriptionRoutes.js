const express = require('express');
const { createSubscription, editSubscription, getAllSubscriptions, getSpecificSubscription, deleteSubscription, getActiveSubscriptionsOfUser, searchSubscriptions, getAllSubscriptionsForDownload, getCoursesBySubscription, getUpgradeSubscriptionDetails,
upgradeSubscription
 } = require('../controller/subscriptionController');
const { isUser } = require("../middleware/authMiddleware");
const router = express.Router()


router.post('/create', isUser, createSubscription)
router.patch('/update' , isUser,  editSubscription)
router.get('/get-all', getAllSubscriptions)
router.get('/get-specific', getSpecificSubscription)
router.delete('/delete', isUser, deleteSubscription)
router.get('/get-all-active-subscriptions-of-user', getActiveSubscriptionsOfUser)
router.get('/search-subscriptions', searchSubscriptions)
router.get('/get-all-subscriptions-for-download', getAllSubscriptionsForDownload)
router.get('/get-courses-by-subscription', getCoursesBySubscription)
router.get('/get-upgrade-subscription-details', getUpgradeSubscriptionDetails)
router.post('/upgrade-subscription', upgradeSubscription)

module.exports = router;
