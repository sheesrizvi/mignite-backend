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
const { notFound, errorHandler } = require('./middleware/errorMiddleware.js')
const upload = require("./routes/upload");
const userRoutes = require("./routes/userRoutes");

const cors = require("cors");
const LiveSection = require("./models/liveSectionModel");
const { scheduleMeeting } = require("./middleware/meetingLinkGenerate");





const app = express();
const source = process.env.MONGO_URI;
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
app.use(notFound)
app.use(errorHandler)
// app.use("/api/send", send);
// app.use("/api/rnPushTokens", rnPushTokens);

mongoose
  .connect(source)
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB connection error", err));

const PORT = process.env.PORT || 8000;





app.listen(PORT, () => {
  console.log(`Successfully served on port: ${PORT}.`);
});



