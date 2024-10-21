const express = require("express");
const { sendPushNotification, sendNotificationToAllUsers, sendNotificationToOneUser, getNotifications, getNotificationById, readStatusUpdate } = require("../controller/notificationController")
const { admin } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/send-notification", sendPushNotification);
router.post("/send-push-notification-to-all-users", sendNotificationToAllUsers);
router.post("/send-push-notification-to-single-user", sendNotificationToOneUser);
router.get("/get-notification-by-id", getNotificationById);
router.get("/get-all-notifications", getNotifications);
router.get("/read-notfication", readStatusUpdate);

module.exports = router;
