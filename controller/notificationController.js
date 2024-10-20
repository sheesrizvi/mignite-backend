const asyncHandler = require('express-async-handler');
const firebaseAdmin = require('../middleware/firebase');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

const sendPushNotification = asyncHandler(async (req, res) => {
    const message = {
        token: 'eV0cuHuNBbICw2F6J21Pki:APA91bESs8tiH3_mbbLq5Q6yZTfaPc9WL_0Ecy2Pm90tI0QM1xIdLCgMSqHjK5OL5NbabBkC1rmzSrqRE4NYacCiTQYeYI9_0UfhUSkh3x7dFExUWDu7v8LdXSMMjMisaE8p8sFd_AGI',
        notification: {
            title: 'Hi',
            body: 'Hi',
        },
    };

    try {
        const response = await firebaseAdmin.messaging().send(message);
        console.log('Successfully sent message:', response);
        return res.status(200).send({ message: response });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).send({ error: 'Failed to send notification' });
    }
});


const sendNotificationToAllUsers = asyncHandler(async (req, res) => {
    const { title, body, image } = req.body;
    let users = await User.find({ pushToken: { $exists: true, $ne: null } });
    const tokens = users.map((user) => user.pushToken);
    users = users.map(user => ({ user: user._id, isRead: false, readAt: null }));
    const notification = { title, body, image };
    const response = await firebaseAdmin.messaging().sendEachForMulticast({ tokens, notification });

    const notifications = await Notification.create({
        users,
        message: notification
    });

    res.status(200).send({ message: 'Notification sent successfully', notifications });
});

const sendNotificationToOneUser = asyncHandler(async (req, res) => {
    const { id, title, body, image } = req.body;
    const user = await User.findOne({ _id: id, pushToken: { $exists: true, $ne: null } });
    if (!user) return res.status(400).send({ message: 'User not found' });
    const token = user.pushToken;
    const notification = { title, body, image };
    await firebaseAdmin.messaging().send({ token, notification });

    const notifications = await Notification.create({
        users: [{ user: user._id, isRead: false, readAt: null }],
        message: notification
    });

    res.status(200).send({ message: 'Notification sent successfully', notifications });
});

const sendNotificationsInsideApplication = asyncHandler(async (users, tokens, message) => {
    const response = await firebaseAdmin.messaging().sendEachForMulticast({ tokens, notification: message });

    const notifications = await Notification.create({
        users,
        message
    });

    return `Notification Sent Successfully ${notifications}`;
});

const getNotificationById = asyncHandler(async (req, res) => {
    const { id } = req.query;

    const notification = await Notification.findById(id).populate('users.user', 'name email');
    if (!notification) return res.status(400).send({ message: "No Notification Found" });

    res.status(200).send(notification);
});

const getNotifications = asyncHandler(async (req, res) => {
    const { id } = req.query;

    const notifications = await Notification.find({ 'users.user': id }).populate('users.user', 'name email');

    if (notifications.length === 0) res.status(200).send({ message: 'Notifications', notifications });
});

module.exports = {
    sendPushNotification,
    sendNotificationToAllUsers,
    sendNotificationToOneUser,
    sendNotificationsInsideApplication,
    getNotificationById,
    getNotifications
};
