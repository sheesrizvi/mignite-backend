require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const adminRoutes = require("./routes/adminRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const sectionRoutes = require("./routes/sectionRoutes");
const courseRoutes = require("./routes/courseRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const liveCourseRoutes = require("./routes/liveCourseRoute")
const liveSectionRoutes = require("./routes/liveSectionRoutes.js")
const meetingRoutes = require("./routes/meetingRoutes.js")
const planRoutes = require("./routes/planRoutes.js")
const subscriptionRoutes = require("./routes/subscriptionRoutes.js")
const orderRoutes = require("./routes/orderRoutes.js")
const reviewRoutes = require("./routes/reviewRoutes.js")
const couponRoutes = require("./routes/couponRoutes.js")
const rnPushTokenRoutes = require("./routes/rnPushToken.js")
const notificationRoutes = require("./routes/notificationRoutes.js")
const dashboardRoutes = require('./routes/analyticsRoutes.js')
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js')
const { startAgenda } = require("./jobs/agendaConnection.js");
const upload = require("./routes/upload");
const userRoutes = require("./routes/userRoutes");
const bannerRoutes = require('./routes/bannerRoutes.js')
const bannerSecondRoutes = require('./routes/bannerSecondRoutes.js')
const doubtRoutes = require('./routes/doubtRoutes.js')
const cron = require('node-cron')
const cors = require("cors");
const LiveSection = require("./models/liveSectionModel");
const { scheduleMeeting } = require("./middleware/meetingLinkGenerate");
const { checkAndUpdateSubscriptions } = require('./controller/subscriptionController.js')
const aiFeatureRoutes = require('./routes/aiFeatureRoutes.js');
const Instructor = require("./models/instructorModel.js");
const Course = require('./models/coursesModel.js')
const LiveCourse = require('./models/liveCourseModel.js')
const { Subscription } = require('./models/subscriptionModel.js')
const User = require('./models/userModel.js')
const app = express();
const source = process.env.MONGO_URI


app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/section", sectionRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/livecourse", liveCourseRoutes)
app.use("/api/livesection", liveSectionRoutes)
app.use("/api/meeting", meetingRoutes)
app.use("/api/plans", planRoutes)
app.use("/api/upload", upload)
app.use("/api/subscriptions", subscriptionRoutes)
app.use("/api/order", orderRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/coupons", couponRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/rnPushTokens", rnPushTokenRoutes)
app.use("/api/analytics", dashboardRoutes)
app.use("/api/aifeature", aiFeatureRoutes)
app.use('/api/banner', bannerRoutes)
app.use('/api/bannersecond', bannerSecondRoutes)
app.use("/api/doubt", doubtRoutes)
app.use(notFound)
app.use(errorHandler)
// app.use("/api/send", send);
// app.use("/api/rnPushTokens", rnPushTokens);

mongoose
  .connect(source)
  .then(async () => {
    console.log("DB connected")
    startAgenda();
  })
  .catch((err) => console.log("DB connections error", err));

const PORT = process.env.PORT || 8000;

cron.schedule('0 0 * * *', () => {
  console.log('Running the Subscription expiry check')
  checkAndUpdateSubscriptions()
})

app.listen(PORT, async () => {
  console.log(`Successfully served on this ports: ${PORT}.`);
});


