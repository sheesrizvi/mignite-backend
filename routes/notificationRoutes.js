const express = require("express");
const { sendPushNotification, sendNotificationToAllUsers, sendNotificationToOneUser, getNotifications, getNotificationById } = require("../controller/notificationController")
const { admin } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/send-notification", sendPushNotification);
router.post("/send-push-notification-to-all-users", admin, sendNotificationToAllUsers);
router.post("/send-push-notification-to-single-user", admin, sendNotificationToOneUser);
router.get("/get-notification-by-id", getNotificationById);
router.get("/get-all-notifications", getNotifications);

module.exports = router;
