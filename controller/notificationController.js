const asyncHandler = require('express-async-handler');
const firebaseAdmin = require('../middleware/firebase');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

const sendPushNotification = asyncHandler(async (req, res) => {
    const { title, body, image, token } = req.body

        // token: 'eV0cuHuNBbICw2F6J21Pki:APA91bESs8tiH3_mbbLq5Q6yZTfaPc9WL_0Ecy2Pm90tI0QM1xIdLCgMSqHjK5OL5NbabBkC1rmzSrqRE4NYacCiTQYeYI9_0UfhUSkh3x7dFExUWDu7v8LdXSMMjMisaE8p8sFd_AGI',
    const message = {
        notification: {
          title,
          body
        },
        data: {
          title,
          body,
          image
        },
        android: {
          notification: {
            imageUrl: image,
          },
        },
        apns: {
            payload: {
              aps: {
                'mutable-content': 1
              }
            },
            fcm_options: {
              image: image
            }
          },
        webpush: {
          headers: {
            image
          }
        },
        tokens: [token]
      };

        const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
        return res.status(200).send({ message: response });
    
});


const sendNotificationToAllUsers = asyncHandler(async (req, res) => {
    const { title, body, image } = req.body;
    let users = await User.find({ pushToken: { $exists: true, $ne: null } });
    const tokens = users.map((user) => user.pushToken);
    
    const message = {
      notification: {
        title,
        body
      },
      data: {
        title,
        body,
        image
      },
      android: {
        notification: {
          imageUrl: image,
        },
      },
      apns: {
          payload: {
            aps: {
              'mutable-content': 1
            }
          },
          fcm_options: {
            image: image
          }
        },
      webpush: {
        headers: {
          image
        }
      },
      tokens
    };
      

    const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
    const unNotifiedUsers = [];
    const notifiedUsers = []
    response.responses.forEach((resp, index) => {
        if (!resp.success) {
            const user = users[index]; 
            if (user) {
                unNotifiedUsers.push(user.email);
            }
        }
        if (resp.success) {
          const user = users[index]; 
          if (user) {
              notifiedUsers.push({user: user._id, isRead: false});
          }
      }
    });
    const notification = { title, body, image };
  
    const notifications = await Notification.create({
        users: notifiedUsers,
        message: notification
    });
     
    res.status(200).send({ message: 'Notification sent successfully', response, notifications });
});

const sendNotificationToOneUser = asyncHandler(async (req, res) => {
    const { id, title, body, image } = req.body;
    const user = await User.findOne({ _id: id, pushToken: { $exists: true, $ne: null } });
    if (!user) return res.status(400).send({ message: 'User not found' });
    const token = user.pushToken;

    const message = {
      notification: {
        title,
        body
      },
      data: {
        title,
        body,
        image
      },
      android: {
        notification: {
          imageUrl: image,
        },
      },
      apns: {
          payload: {
            aps: {
              'mutable-content': 1
            }
          },
          fcm_options: {
            image: image
          }
        },
      webpush: {
        headers: {
          image
        }
      },
      token
    };


   const notification = { title, body, image };
   const response = await firebaseAdmin.messaging().send(message);

    const notifications = await Notification.create({
        users: [{ user: user._id, isRead: false }],
        message: notification
    });

    res.status(200).send({ message: 'Notification sent successfully', response, notifications});
});


const sendNotificationsInsideApplicationToSingleUser = asyncHandler(async (title, body, userId) => {
  const user = await User.findOne({ _id: userId, pushToken: { $exists: true, $ne: null } })
  if(!user) return `User not found or Push Token not exist`

  token = user.pushToken
  
  const message = {
    notification: {
      title,
      body
    },
    data: {
      title,
      body
    },
    token
  };
    const response = await firebaseAdmin.messaging().send(message);

    const notifications = await Notification.create({
        users: [{ user: userId, isRead: false }],
        message
    });

    return `Notification Sent Status ${response} ${notifications}`;
});


const sendNotificationsInsideApplicationToMultipleUser = asyncHandler(async (users, msg) => {
  const tokens = users.map(user => user.pushToken)
  const {title, body} = msg
  const message = {
    notification: {
      title,
      body
    },
    data: {
      title,
      body
    },
    tokens
  };
   
    const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
    const unNotifiedUsers = [];
    const notifiedUsers = []
    response.responses.forEach((resp, index) => {
        if (!resp.success) {
            const user = users[index]; 
            if (user) {
                unNotifiedUsers.push(user._id);
            }
        }
        if (resp.success) {
          const user = users[index]; 
          if (user) {
              notifiedUsers.push({user: user._id, isRead: false});
          }
      }
    });
    const notification = { title, body };
  
    const notifications = await Notification.create({
        users: notifiedUsers,
        message: notification
    });

    return `Notification Sent Status ${response} ${notifications}`;
});

const getNotificationById = asyncHandler(async (req, res) => {
    const { id } = req.query;

    const notification = await Notification.findById(id).populate('users.user', 'name email');
    if (!notification) return res.status(400).send({ message: "No Notification Found" });

    res.status(200).send(notification);
});


const getNotificationByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  const notification = await Notification.find({'users.user': userId}).populate('users.user');
  if (!notification) return res.status(400).send({ message: "No Notification Found" });

  res.status(200).send({notification});
});

const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({})
    if(notifications.length === 0) return res.status(400).send({message: "No Notifications found"})
    res.status(200).send({ message: 'Notifications', notifications });
});

const readStatusUpdate = asyncHandler(async (req, res) => {
    const { notificationId, userId, read } = req.query
   
   const notification = await Notification.findOneAndUpdate({ notification: notificationId , 'users.user': userId, }, {
        $set: { 'users.$.isRead': read }
    }, {new: true })
    
   if(!notification) return res.status(400).send({message: "Read status Update failed, Please check user details again"})

    res.status(200).send({message: "Notification read status updated successfully", notification})
})

const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.query
  
  const notification = await Notification.findOne({ _id: notificationId })
  
  if(!notification) return res.status(400).send({message: "Notification deleted successfully"})
  await Notification.findByIdAndDelete(notification._id)
  res.status(200).send({message: "Notification deleted successfully", notification})
})

module.exports = {
    sendPushNotification,
    sendNotificationToAllUsers,
    sendNotificationToOneUser,
    sendNotificationsInsideApplicationToSingleUser,
    sendNotificationsInsideApplicationToMultipleUser,
    getNotificationByUserId,
    getNotificationById,
    getNotifications,
    readStatusUpdate,
    deleteNotification
};
